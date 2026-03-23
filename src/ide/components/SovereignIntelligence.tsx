// ══════════════════════════════════════════════════════════════
// SovereignIntelligence — Corporate Interference Exposé
// Static intelligence cards exposing Silicon Valley surveillance
// Ported from HaveMesh → HAVEN OFFICIAL by أبو خوارزم
// ══════════════════════════════════════════════════════════════

import { motion } from 'motion/react';
import { Shield, Eye, Lock, AlertTriangle, Skull, Radio, ExternalLink } from 'lucide-react';

interface IntelCard {
  id: string;
  codename: string;
  title: string;
  titleAr: string;
  icon: typeof Shield;
  color: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  classification: string;
  summary: string;
  dataPoints: string[];
  references: { label: string; url: string }[];
}

const INTEL_CARDS: IntelCard[] = [
  {
    id: 'INTEL-001',
    codename: 'PRISM_GHOST',
    title: 'NSA PRISM Participation',
    titleAr: 'مشاركة بريزم',
    icon: Eye,
    color: '#FF0040',
    severity: 'CRITICAL',
    classification: 'PUBLIC RECORD — Snowden Docs 2013',
    summary: 'Major tech companies provide direct access to their servers for NSA data collection.',
    dataPoints: [
      'Google, Microsoft, Apple, Meta — confirmed PRISM participants',
      'Real-time access to email, files, voice chat, video calls',
      'FISA Section 702 provides legal cover — no individual warrant needed',
      'Program cost: $20M/year. Revenue from your data: $billions.',
    ],    references: [
      { label: 'Snowden Archive', url: 'https://edwardsnowden.com' },
      { label: 'The Guardian PRISM Report', url: 'https://www.theguardian.com/world/2013/jun/06/us-tech-giants-nsa-data' },
      { label: 'FISA Section 702', url: 'https://www.intelligence.gov/foreign-intelligence-surveillance-act' },
    ],  },
  {
    id: 'INTEL-002',
    codename: 'CLOUD_ACT',
    title: 'US CLOUD Act Jurisdiction',
    titleAr: 'قانون الكلاود الأمريكي',
    icon: Lock,
    color: '#FF6B00',
    severity: 'CRITICAL',
    classification: 'US LAW — Enacted March 2018',
    summary: 'US law enforcement can compel US companies to provide data stored anywhere in the world.',
    dataPoints: [
      'Signed into law March 23, 2018 — bipartisan support',
      'Applies to ALL data held by US companies regardless of storage location',
      'Saudi data on Azure/AWS = accessible to US prosecutors',
      'No requirement to notify the data subject or foreign government',
    ],    references: [
      { label: 'CLOUD Act Full Text', url: 'https://www.congress.gov/bill/115th-congress/house-bill/4943' },
      { label: 'EFF Analysis', url: 'https://www.eff.org/deeplinks/2018/03/responsibility-deflected-cloud-act-passes' },
    ],  },
  {
    id: 'INTEL-003',
    codename: 'TELEMETRY_FLOOD',
    title: 'IDE Telemetry Surveillance',
    titleAr: 'مراقبة الـ IDE',
    icon: Radio,
    color: '#FFD700',
    severity: 'HIGH',
    classification: 'TECHNICAL ANALYSIS — 2024',
    summary: 'VS Code and JetBrains IDEs transmit developer activity data to corporate servers.',
    dataPoints: [
      'VS Code: telemetry.vscode.dev — file types, extensions, commands used',
      'GitHub Copilot: full file content sent on every completion request',
      'JetBrains: usage stats, project structure, plugin data',
      'IntelliJ crash reports include stack traces with file paths',
    ],    references: [
      { label: 'VS Code Telemetry Docs', url: 'https://code.visualstudio.com/docs/getstarted/telemetry' },
      { label: 'Copilot Privacy FAQ', url: 'https://docs.github.com/en/copilot/overview-of-github-copilot/about-github-copilot-individual' },
    ],  },
  {
    id: 'INTEL-004',
    codename: 'DRAGON_SHIELD',
    title: 'HAVEN Sovereign Response',
    titleAr: 'الرد السيادي',
    icon: Shield,
    color: '#00FF00',
    severity: 'MEDIUM',
    classification: 'HAVEN INTERNAL — ACTIVE',
    summary: 'HAVEN IDE operates 100% locally with zero external data transmission.',
    dataPoints: [
      '✅ All AI inference via local Ollama — zero cloud API calls',
      '✅ NiyahEngine processes Arabic locally — no Google Translate',
      '✅ Git operations via isomorphic-git — no GitHub dependency',
      '✅ PDPL compliant — data never leaves sovereign jurisdiction',
      '✅ Three-Lobe system: Cognitive + Executive + Sensory — all local',
    ],    references: [
      { label: 'HAVEN Source', url: 'https://haven-ide.vercel.app' },
      { label: 'Saudi PDPL Full Text', url: 'https://sdaia.gov.sa/en/SDAIA/aboutSDIA/Documents/PersonalDataProtectionLaw.pdf' },
    ],  },
];

const SEVERITY_GLOW: Record<string, string> = {
  CRITICAL: '0 0 20px rgba(255,0,64,0.3)',
  HIGH: '0 0 20px rgba(255,107,0,0.2)',
  MEDIUM: '0 0 20px rgba(0,255,0,0.15)',
};

export const SovereignIntelligence = () => {
  return (
    <div className="h-full flex flex-col bg-black/40">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-bold text-green-400 flex items-center gap-2">
          <Skull className="w-4 h-4" />
          SOVEREIGN INTELLIGENCE BRIEFING
        </h2>
        <p className="text-[10px] text-white/40 mt-1">
          ملخص استخباراتي — Corporate Surveillance Dossier
        </p>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {INTEL_CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className="rounded-lg border p-3 transition-all hover:bg-white/5"
              style={{
                borderColor: card.color + '30',
                boxShadow: SEVERITY_GLOW[card.severity],
              }}
            >
              {/* Card header */}
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 shrink-0" style={{ color: card.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold" style={{ color: card.color }}>
                      {card.codename}
                    </span>
                    <span
                      className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                      style={{
                        color: card.color,
                        backgroundColor: card.color + '15',
                      }}
                    >
                      {card.severity}
                    </span>
                  </div>
                  <div className="text-[10px] text-white/60 truncate">{card.title}</div>
                </div>
              </div>

              {/* Classification */}
              <div className="text-[8px] font-mono text-white/30 mb-2 px-1">
                {card.classification}
              </div>

              {/* Summary */}
              <p className="text-[10px] text-white/50 leading-relaxed mb-2 px-1">
                {card.summary}
              </p>

              {/* Data points */}
              <div className="space-y-1 px-1">
                {card.dataPoints.map((point, i) => (
                  <div key={i} className="flex gap-1.5">
                    <span className="text-[8px] text-white/20 shrink-0 mt-0.5">▸</span>
                    <span className="text-[9px] text-white/40 leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>

              {/* References */}
              {card.references.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-1 pt-2 mt-1 border-t border-white/5">
                  {card.references.map((ref, i) => (
                    <a
                      key={i}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded border border-white/10 
                                 text-white/30 hover:text-white/60 hover:border-white/20 transition-all"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      {ref.label}
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between">
        <span className="text-[9px] text-white/30 font-mono">
          {INTEL_CARDS.length} intelligence briefings loaded
        </span>
        <span className="text-[9px] text-red-400/50 font-mono flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          CLASSIFICATION: PUBLIC RECORD
        </span>
      </div>
    </div>
  );
};
