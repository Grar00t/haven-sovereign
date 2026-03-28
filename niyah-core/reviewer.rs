use serde::Serialize;

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub enum ReviewSeverity {
    Info,
    Warning,
    Critical,
}

impl ReviewSeverity {
    fn penalty(&self) -> u8 {
        match self {
            ReviewSeverity::Info => 5,
            ReviewSeverity::Warning => 15,
            ReviewSeverity::Critical => 30,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub enum ReviewCategory {
    ExternalConnection,
    HardcodedEndpoint,
    TelemetryHook,
    NetworkPrimitive,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct ReviewFinding {
    pub title: String,
    pub detail: String,
    pub severity: ReviewSeverity,
    pub category: ReviewCategory,
    pub line: usize,
    pub evidence: String,
}

#[derive(Clone, Debug, Default, Serialize)]
pub struct SovereignCodeReview {
    pub file_path: String,
    pub language: String,
    pub sovereignty_score: u8,
    pub findings: Vec<ReviewFinding>,
    pub summary: String,
}

#[derive(Clone, Debug)]
struct ReviewRule {
    pattern: &'static str,
    title: &'static str,
    detail: &'static str,
    severity: ReviewSeverity,
    category: ReviewCategory,
}

pub fn review_code(code: &str, file_path: &str, language: Option<&str>) -> SovereignCodeReview {
    let review_language = normalize_language(file_path, language);
    let mut findings: Vec<ReviewFinding> = Vec::new();

    for (index, line) in code.lines().enumerate() {
        let line_number = index + 1;
        let normalized = line.trim().to_lowercase();

        if normalized.is_empty() {
            continue;
        }

        for rule in review_rules() {
            if normalized.contains(rule.pattern) {
                findings.push(ReviewFinding {
                    title: rule.title.to_string(),
                    detail: rule.detail.to_string(),
                    severity: rule.severity.clone(),
                    category: rule.category.clone(),
                    line: line_number,
                    evidence: truncate_evidence(line),
                });
            }
        }

        if let Some(endpoint_finding) = classify_endpoint(&normalized, line_number, line) {
            findings.push(endpoint_finding);
        }
    }

    findings.sort_by_key(|finding| (severity_rank(&finding.severity), finding.line));
    findings.dedup_by(|left, right| {
        left.line == right.line
            && left.title == right.title
            && left.evidence == right.evidence
            && left.category == right.category
    });

    let total_penalty = findings
        .iter()
        .map(|finding| u16::from(finding.severity.penalty()))
        .sum::<u16>()
        .min(100);
    let sovereignty_score = 100u8.saturating_sub(total_penalty as u8);

    let summary = if findings.is_empty() {
        "No external egress indicators were detected in the reviewed source.".to_string()
    } else {
        format!(
            "Detected {} sovereignty risk indicator(s) in the active source file.",
            findings.len()
        )
    };

    SovereignCodeReview {
        file_path: file_path.to_string(),
        language: review_language,
        sovereignty_score,
        findings,
        summary,
    }
}

fn normalize_language(file_path: &str, language: Option<&str>) -> String {
    if let Some(language) = language {
        let trimmed = language.trim();
        if !trimmed.is_empty() {
            return trimmed.to_string();
        }
    }

    file_path
        .rsplit_once('.')
        .map(|(_, extension)| extension.to_string())
        .filter(|extension| !extension.is_empty())
        .unwrap_or_else(|| "plaintext".to_string())
}

fn classify_endpoint(normalized_line: &str, line_number: usize, original_line: &str) -> Option<ReviewFinding> {
    if !normalized_line.contains("http://") && !normalized_line.contains("https://") {
        return None;
    }

    let local_markers = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
    let telemetry_markers = [
        "google-analytics",
        "doubleclick",
        "segment",
        "mixpanel",
        "hotjar",
        "fullstory",
        "sentry",
        "amplitude",
    ];

    let (title, detail, severity, category) = if telemetry_markers
        .iter()
        .any(|marker| normalized_line.contains(marker))
    {
        (
            "Telemetry endpoint hardcoded",
            "This line embeds a known telemetry or analytics endpoint that could exfiltrate usage data.",
            ReviewSeverity::Critical,
            ReviewCategory::TelemetryHook,
        )
    } else if local_markers
        .iter()
        .any(|marker| normalized_line.contains(marker))
    {
        (
            "Local endpoint referenced",
            "A local development endpoint is hardcoded here. Review before promoting this file to production.",
            ReviewSeverity::Info,
            ReviewCategory::HardcodedEndpoint,
        )
    } else {
        (
            "Remote endpoint hardcoded",
            "This line embeds a remote endpoint directly in source, which should be reviewed for sovereignty and data residency.",
            ReviewSeverity::Warning,
            ReviewCategory::HardcodedEndpoint,
        )
    };

    Some(ReviewFinding {
        title: title.to_string(),
        detail: detail.to_string(),
        severity,
        category,
        line: line_number,
        evidence: truncate_evidence(original_line),
    })
}

fn truncate_evidence(line: &str) -> String {
    const MAX_EVIDENCE_CHARS: usize = 120;

    let trimmed = line.trim();
    if trimmed.chars().count() <= MAX_EVIDENCE_CHARS {
        return trimmed.to_string();
    }

    let truncated: String = trimmed.chars().take(MAX_EVIDENCE_CHARS).collect();
    format!("{truncated}...")
}

fn severity_rank(severity: &ReviewSeverity) -> u8 {
    match severity {
        ReviewSeverity::Critical => 0,
        ReviewSeverity::Warning => 1,
        ReviewSeverity::Info => 2,
    }
}

fn review_rules() -> &'static [ReviewRule] {
    const RULES: &[ReviewRule] = &[
        ReviewRule {
            pattern: "fetch(",
            title: "Dynamic fetch detected",
            detail: "This file initiates an HTTP fetch call. Verify the destination and payload policy before shipping.",
            severity: ReviewSeverity::Warning,
            category: ReviewCategory::ExternalConnection,
        },
        ReviewRule {
            pattern: "xmlhttprequest",
            title: "XMLHttpRequest usage detected",
            detail: "Legacy HTTP request usage can hide external calls outside the main network layer.",
            severity: ReviewSeverity::Warning,
            category: ReviewCategory::ExternalConnection,
        },
        ReviewRule {
            pattern: "websocket(",
            title: "WebSocket channel detected",
            detail: "A WebSocket connection can stream data continuously to a remote endpoint.",
            severity: ReviewSeverity::Critical,
            category: ReviewCategory::ExternalConnection,
        },
        ReviewRule {
            pattern: "eventsource(",
            title: "Server-sent event stream detected",
            detail: "A long-lived event stream was detected and should be reviewed for cross-border telemetry.",
            severity: ReviewSeverity::Warning,
            category: ReviewCategory::ExternalConnection,
        },
        ReviewRule {
            pattern: "navigator.sendbeacon",
            title: "Beacon API detected",
            detail: "sendBeacon is frequently used for background telemetry and should be explicitly justified.",
            severity: ReviewSeverity::Critical,
            category: ReviewCategory::TelemetryHook,
        },
        ReviewRule {
            pattern: "google-analytics",
            title: "Analytics hook detected",
            detail: "A known analytics integration was detected in source and may violate sovereign deployment rules.",
            severity: ReviewSeverity::Critical,
            category: ReviewCategory::TelemetryHook,
        },
        ReviewRule {
            pattern: "sentry",
            title: "Remote error telemetry detected",
            detail: "Sentry or a similar telemetry sink appears in source and should be reviewed for data residency.",
            severity: ReviewSeverity::Warning,
            category: ReviewCategory::TelemetryHook,
        },
        ReviewRule {
            pattern: "mixpanel",
            title: "Behavioral analytics SDK detected",
            detail: "A behavioral analytics reference appears in code and may export user behavior externally.",
            severity: ReviewSeverity::Critical,
            category: ReviewCategory::TelemetryHook,
        },
        ReviewRule {
            pattern: "@tauri-apps/plugin-http",
            title: "Tauri HTTP plugin detected",
            detail: "The desktop shell is importing the Tauri HTTP plugin, which can open outbound network paths.",
            severity: ReviewSeverity::Warning,
            category: ReviewCategory::NetworkPrimitive,
        },
        ReviewRule {
            pattern: "reqwest::",
            title: "Rust HTTP client detected",
            detail: "The Rust layer is constructing outbound HTTP requests via reqwest.",
            severity: ReviewSeverity::Warning,
            category: ReviewCategory::NetworkPrimitive,
        },
        ReviewRule {
            pattern: "tcpstream::connect",
            title: "Raw TCP connection detected",
            detail: "A direct TCP connection primitive was found and should be reviewed under the sovereignty policy.",
            severity: ReviewSeverity::Critical,
            category: ReviewCategory::NetworkPrimitive,
        },
        ReviewRule {
            pattern: "tokio::net::tcpstream",
            title: "Async TCP client detected",
            detail: "An async TCP client primitive was found and may open unmanaged outbound channels.",
            severity: ReviewSeverity::Critical,
            category: ReviewCategory::NetworkPrimitive,
        },
        ReviewRule {
            pattern: "udpsocket::bind",
            title: "UDP socket primitive detected",
            detail: "A UDP socket primitive appears in source and should be audited for hidden egress.",
            severity: ReviewSeverity::Warning,
            category: ReviewCategory::NetworkPrimitive,
        },
        ReviewRule {
            pattern: "curl ",
            title: "curl invocation detected",
            detail: "A shell-based curl call was detected and should be moved behind an approved network policy.",
            severity: ReviewSeverity::Warning,
            category: ReviewCategory::ExternalConnection,
        },
        ReviewRule {
            pattern: "wget ",
            title: "wget invocation detected",
            detail: "A shell-based wget call was detected and should be moved behind an approved network policy.",
            severity: ReviewSeverity::Warning,
            category: ReviewCategory::ExternalConnection,
        },
    ];

    RULES
}

#[cfg(test)]
mod tests {
    use super::{review_code, ReviewCategory, ReviewSeverity};

    #[test]
    fn flags_external_connection_patterns() {
        let review = review_code(
            "const data = await fetch('https://api.example.com/x');\nconst ws = new WebSocket('wss://stream.example.com');",
            "src/example.ts",
            Some("typescript"),
        );

        assert!(review.sovereignty_score < 100);
        assert!(review
            .findings
            .iter()
            .any(|finding| finding.category == ReviewCategory::ExternalConnection));
        assert!(review
            .findings
            .iter()
            .any(|finding| finding.severity == ReviewSeverity::Critical));
    }

    #[test]
    fn keeps_local_endpoints_low_severity() {
        let review = review_code(
            "fetch('http://localhost:11434/api/generate')",
            "src/ollama.ts",
            Some("typescript"),
        );

        assert!(review
            .findings
            .iter()
            .any(|finding| finding.category == ReviewCategory::HardcodedEndpoint));
        assert!(review
            .findings
            .iter()
            .any(|finding| finding.severity == ReviewSeverity::Info));
    }
}
