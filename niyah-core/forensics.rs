use serde::Serialize;
#[cfg(target_os = "windows")]
use std::process::Command;

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub enum ThreatCategory {
    SovereigntyViolation,
    RemoteAccess,
    TrafficInspection,
}

impl ThreatCategory {
    pub fn label(&self) -> &'static str {
        match self {
            ThreatCategory::SovereigntyViolation => "SOVEREIGNTY_VIOLATION",
            ThreatCategory::RemoteAccess => "REMOTE_ACCESS",
            ThreatCategory::TrafficInspection => "TRAFFIC_INSPECTION",
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct ThreatFinding {
    pub process_name: String,
    pub indicator: String,
    pub category: ThreatCategory,
}

#[derive(Clone, Debug, Default, Serialize)]
pub struct ForensicReport {
    pub scanned_processes: usize,
    pub findings: Vec<ThreatFinding>,
}

impl ForensicReport {
    pub fn threat_count(&self) -> usize {
        self.findings.len()
    }

    pub fn is_clean(&self) -> bool {
        self.findings.is_empty()
    }
}

#[derive(Clone, Debug)]
struct ThreatIndicator {
    pattern: &'static str,
    category: ThreatCategory,
}

pub struct ProcessGuard {
    indicators: Vec<ThreatIndicator>,
}

impl ProcessGuard {
    pub fn new() -> Self {
        Self {
            indicators: vec![
                ThreatIndicator {
                    pattern: "telemetry",
                    category: ThreatCategory::SovereigntyViolation,
                },
                ThreatIndicator {
                    pattern: "analytics",
                    category: ThreatCategory::SovereigntyViolation,
                },
                ThreatIndicator {
                    pattern: "microsoft",
                    category: ThreatCategory::SovereigntyViolation,
                },
                ThreatIndicator {
                    pattern: "google",
                    category: ThreatCategory::SovereigntyViolation,
                },
                ThreatIndicator {
                    pattern: "teamviewer",
                    category: ThreatCategory::RemoteAccess,
                },
                ThreatIndicator {
                    pattern: "anydesk",
                    category: ThreatCategory::RemoteAccess,
                },
                ThreatIndicator {
                    pattern: "rustdesk",
                    category: ThreatCategory::RemoteAccess,
                },
                ThreatIndicator {
                    pattern: "screenconnect",
                    category: ThreatCategory::RemoteAccess,
                },
                ThreatIndicator {
                    pattern: "wireshark",
                    category: ThreatCategory::TrafficInspection,
                },
                ThreatIndicator {
                    pattern: "burp",
                    category: ThreatCategory::TrafficInspection,
                },
                ThreatIndicator {
                    pattern: "mitmproxy",
                    category: ThreatCategory::TrafficInspection,
                },
                ThreatIndicator {
                    pattern: "charles",
                    category: ThreatCategory::TrafficInspection,
                },
            ],
        }
    }

    pub fn scan_report(&self) -> Result<ForensicReport, String> {
        let process_names = enumerate_process_names()?;
        Ok(self.analyze_process_names(process_names))
    }

    pub fn analyze_process_names<I, S>(&self, process_names: I) -> ForensicReport
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let mut report = ForensicReport::default();

        for process_name in process_names {
            let normalized_name = process_name.as_ref().trim().to_lowercase();
            if normalized_name.is_empty() {
                continue;
            }

            report.scanned_processes += 1;

            if let Some(indicator) = self
                .indicators
                .iter()
                .find(|indicator| normalized_name.contains(indicator.pattern))
            {
                report.findings.push(ThreatFinding {
                    process_name: normalized_name,
                    indicator: indicator.pattern.to_string(),
                    category: indicator.category.clone(),
                });
            }
        }

        report
    }

    #[allow(dead_code)]
    pub fn scan_and_purge(&self) -> Result<usize, String> {
        Ok(self.scan_report()?.threat_count())
    }
}

#[cfg(target_os = "linux")]
fn enumerate_process_names() -> Result<Vec<String>, String> {
    let proc_dir = fs::read_dir("/proc").map_err(|e| e.to_string())?;
    let mut process_names = Vec::new();

    for entry in proc_dir {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if !path.is_dir() {
            continue;
        }

        let Some(file_name) = path.file_name() else {
            continue;
        };

        if !file_name
            .to_string_lossy()
            .chars()
            .all(|c| c.is_ascii_digit())
        {
            continue;
        }

        let comm_path = path.join("comm");
        if let Ok(comm) = fs::read_to_string(comm_path) {
            process_names.push(comm.trim().to_lowercase());
        }
    }

    Ok(process_names)
}

#[cfg(target_os = "windows")]
fn enumerate_process_names() -> Result<Vec<String>, String> {
    let output = Command::new("tasklist")
        .args(["/fo", "csv", "/nh"])
        .output()
        .map_err(|e| format!("failed to run tasklist: {e}"))?;

    if !output.status.success() {
        return Err(format!(
            "tasklist returned non-zero exit status: {}",
            output.status
        ));
    }

    let stdout = String::from_utf8(output.stdout).map_err(|e| e.to_string())?;
    let mut process_names = Vec::new();

    for line in stdout.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        if let Some(stripped) = trimmed.strip_prefix('"') {
            if let Some((name, _)) = stripped.split_once("\",") {
                process_names.push(name.to_lowercase());
            }
        }
    }

    Ok(process_names)
}

#[cfg(not(any(target_os = "linux", target_os = "windows")))]
fn enumerate_process_names() -> Result<Vec<String>, String> {
    Err("process enumeration is not implemented for this platform".to_string())
}

#[cfg(test)]
mod tests {
    use super::{ProcessGuard, ThreatCategory};

    #[test]
    fn detects_remote_access_and_inspection_tools() {
        let guard = ProcessGuard::new();
        let report = guard.analyze_process_names([
            "explorer.exe",
            "TeamViewer.exe",
            "Wireshark.exe",
            "code.exe",
        ]);

        assert_eq!(report.scanned_processes, 4);
        assert_eq!(report.threat_count(), 2);
        assert!(report
            .findings
            .iter()
            .any(|finding| finding.category == ThreatCategory::RemoteAccess));
        assert!(report
            .findings
            .iter()
            .any(|finding| finding.category == ThreatCategory::TrafficInspection));
    }

    #[test]
    fn ignores_benign_processes() {
        let guard = ProcessGuard::new();
        let report = guard.analyze_process_names(["explorer.exe", "code.exe", "powershell.exe"]);

        assert_eq!(report.scanned_processes, 3);
        assert!(report.is_clean());
    }
}
