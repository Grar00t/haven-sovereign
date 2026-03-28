import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Key, Lock, Activity, RefreshCw, FileText } from 'lucide-react';
import { sovereignSessionCleaner } from '../engine/SovereignSessionCleaner';
import {
  sovereignTauri,
  type ForensicFinding,
  type ForensicReport,
  type SovereignCodeReview,
  type SovereignReviewFinding,
} from '../engine/SovereignTauri';
import { useIDEStore } from '../useIDEStore';
import { useStore } from '../../store/useStore';

const CASE_403_ARCHIVE_NOTE = 'Archived locally in FORENSIC_REPORT_PROJECT_DRAGON_403_HILO_V2.md';
const CATEGORY_LABELS: Record<ForensicFinding['category'], string> = {
  SovereigntyViolation: 'Sovereignty',
  RemoteAccess: 'Remote Access',
  TrafficInspection: 'Traffic Inspection',
};
const REVIEW_SEVERITY_LABELS: Record<SovereignReviewFinding['severity'], string> = {
  Info: 'Info',
  Warning: 'Warning',
  Critical: 'Critical',
};
const REVIEW_CATEGORY_LABELS: Record<SovereignReviewFinding['category'], string> = {
  ExternalConnection: 'External Connection',
  HardcodedEndpoint: 'Hardcoded Endpoint',
  TelemetryHook: 'Telemetry Hook',
  NetworkPrimitive: 'Network Primitive',
};

const EMPTY_REPORT: ForensicReport = {
  scanned_processes: 0,
  findings: [],
};

const EMPTY_CODE_REVIEW: SovereignCodeReview = {
  file_path: '',
  language: 'plaintext',
  sovereignty_score: 100,
  findings: [],
  summary: 'No file has been reviewed yet.',
};

export const ForensicLab = () => {
  const { isSovereign } = useStore();
  const activeTab = useIDEStore((state) => state.openTabs.find((tab) => tab.id === state.activeTabId));
  const [stats, setStats] = useState({ chainIndex: 0, sessionCount: 0, active: false });
  const [keys, setKeys] = useState<number[]>([]);
  const [report, setReport] = useState<ForensicReport>(EMPTY_REPORT);
  const [scanLoading, setScanLoading] = useState(true);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastScanAt, setLastScanAt] = useState<number | null>(null);
  const [codeReview, setCodeReview] = useState<SovereignCodeReview>(EMPTY_CODE_REVIEW);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const runCodeReview = useCallback(async () => {
    if (!activeTab) {
      setCodeReview(EMPTY_CODE_REVIEW);
      setReviewError(null);
      return;
    }

    if (activeTab.content.startsWith('data:')) {
      setCodeReview({
        file_path: activeTab.path,
        language: activeTab.language,
        sovereignty_score: 100,
        findings: [],
        summary: 'Binary and embedded asset tabs are skipped by the sovereign reviewer.',
      });
      setReviewError(null);
      return;
    }

    setReviewLoading(true);
    setReviewError(null);

    try {
      const nextReview = await sovereignTauri.reviewCode(
        activeTab.content,
        activeTab.path,
        activeTab.language,
      );
      setCodeReview(nextReview);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Unknown code review failure');
    } finally {
      setReviewLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = sovereignSessionCleaner.getRatchetState();
      setStats(current);

      // Keep the last 8 ratchet keys in view for the visualization.
      if (current.chainIndex > 0) {
        setKeys(prev => {
          const newKeys = [...prev];
          if (newKeys.length === 0 || newKeys[newKeys.length - 1] !== current.chainIndex) {
            newKeys.push(current.chainIndex);
          }
          return newKeys.slice(-8);
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;

    const runScan = async () => {
      if (mounted) {
        setScanLoading(true);
        setScanError(null);
      }

      try {
        const nextReport = await sovereignTauri.scanForensics();
        if (!mounted) return;
        setReport(nextReport);
        setLastScanAt(Date.now());
      } catch (error) {
        if (!mounted) return;
        setScanError(error instanceof Error ? error.message : 'Unknown scan failure');
      } finally {
        if (mounted) {
          setScanLoading(false);
        }
      }
    };

    void runScan();
    const scanInterval = window.setInterval(() => void runScan(), 15000);

    return () => {
      mounted = false;
      window.clearInterval(scanInterval);
    };
  }, []);

  useEffect(() => {
    void runCodeReview();
  }, [runCodeReview]);

  const threatCount = report.findings.length;
  const topFindings = report.findings.slice(0, 4);
  const topReviewFindings = codeReview.findings.slice(0, 5);
  const lastScanLabel = lastScanAt ? new Date(lastScanAt).toLocaleTimeString() : 'Pending';
  const reviewScoreTone = codeReview.sovereignty_score >= 85
    ? 'text-neon-green'
    : codeReview.sovereignty_score >= 60
      ? 'text-yellow-400'
      : 'text-red-400';

  return (
  <div className="h-full flex flex-col bg-[#050505] text-white overflow-hidden p-4">
    {/* Header */}
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
      <div className="flex items-center gap-3">
        <Shield className={`w-5 h-5 ${isSovereign ? 'text-yellow-500' : 'text-neon-green'}`} />
        <h2 className="text-sm font-bold tracking-wider">FORENSIC LAB</h2>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${stats.active ? 'bg-neon-green animate-pulse' : 'bg-red-500'}`} />
        <span className="text-[10px] font-mono text-white/40">RATCHET: {stats.active ? 'ACTIVE' : 'OFFLINE'}</span>
      </div>
    </div>

    {/* Ratchet Visualization */}
    <div className="flex-1 flex flex-col gap-6">
      <div className="bg-white/5 rounded-xl p-4 border border-white/5 relative overflow-hidden">
        <div className="text-[10px] font-mono text-white/30 uppercase mb-4 flex justify-between">
          <span>Rotating Ephemeral Key Chain</span>
          <span>Index: {stats.chainIndex}</span>
        </div>

        <div className="flex items-center gap-2 h-16 relative">
          {/* Chain line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -z-10" />

          {keys.map((k, i) => (
            <motion.div
              key={k}
              initial={{ scale: 0, x: 20 }}
              animate={{ scale: 1, x: 0 }}
              className="relative group"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 bg-[#050505]
                  ${i === keys.length - 1 ? 'border-neon-green text-neon-green' : 'border-white/20 text-white/20'}`}
              >
                <Key size={12} />
              </div>
              {i < keys.length - 1 && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  BURNED
                </div>
              )}
            </motion.div>
          ))}

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="ml-auto"
          >
            <RefreshCw size={14} className="text-white/20" />
          </motion.div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
          <div className="text-[10px] text-white/40 uppercase mb-1">Active Sessions</div>
          <div className="text-2xl font-mono font-bold text-white">{stats.sessionCount}</div>
        </div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
          <div className="text-[10px] text-white/40 uppercase mb-1">Encryption Algo</div>
          <div className="text-lg font-mono font-bold text-neon-green">AES-256-GCM</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
          <div className="text-[10px] text-white/40 uppercase mb-1">Processes Scanned</div>
          <div className="text-2xl font-mono font-bold text-white">
            {scanLoading ? '...' : report.scanned_processes}
          </div>
        </div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
          <div className="text-[10px] text-white/40 uppercase mb-1">Threat Findings</div>
          <div className={`text-2xl font-mono font-bold ${threatCount > 0 ? 'text-red-400' : 'text-neon-green'}`}>
            {scanLoading ? '...' : threatCount}
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] text-white/40 uppercase">Kernel Scan</div>
            <div className="text-sm font-semibold text-white mt-1">
              {scanError
                ? 'Scan degraded'
                : threatCount > 0
                  ? 'Threat indicators detected'
                  : 'System integrity verified'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-white/40 uppercase">Last Scan</div>
            <div className="text-xs font-mono text-white/70 mt-1">{lastScanLabel}</div>
          </div>
        </div>

        {scanError ? (
          <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {scanError}
          </div>
        ) : topFindings.length > 0 ? (
          <div className="space-y-2">
            {topFindings.map((finding, index) => (
              <div key={`${finding.process_name}-${finding.indicator}-${index}`} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{finding.process_name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-red-300">
                    {CATEGORY_LABELS[finding.category]}
                  </div>
                </div>
                <div className="text-[11px] text-white/50 mt-1">Indicator: {finding.indicator}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-neon-green/20 bg-neon-green/5 p-3 text-xs text-neon-green">
            No active threat indicators were reported by the local forensic engine.
          </div>
        )}
      </div>

      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-[10px] text-white/40 uppercase">Sovereign Code Review</div>
            <div className="text-sm font-semibold text-white mt-1">
              {activeTab ? activeTab.name : 'No active file selected'}
            </div>
            <div className="text-[11px] text-white/45 mt-1">
              {activeTab ? codeReview.summary : 'Open a source file in the editor to run a local review.'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void runCodeReview()}
            disabled={!activeTab || reviewLoading}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-white/80 transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reviewLoading ? 'Reviewing...' : 'Review Active File'}
          </button>
        </div>

        {activeTab && (
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="rounded-lg border border-white/5 bg-black/20 p-3">
              <div className="text-[10px] text-white/40 uppercase mb-1">Sovereignty Score</div>
              <div className={`text-2xl font-mono font-bold ${reviewScoreTone}`}>
                {reviewLoading ? '...' : codeReview.sovereignty_score}
              </div>
            </div>
            <div className="rounded-lg border border-white/5 bg-black/20 p-3">
              <div className="text-[10px] text-white/40 uppercase mb-1">Review Findings</div>
              <div className={`text-2xl font-mono font-bold ${topReviewFindings.length > 0 ? 'text-red-400' : 'text-neon-green'}`}>
                {reviewLoading ? '...' : codeReview.findings.length}
              </div>
            </div>
          </div>
        )}

        {reviewError ? (
          <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {reviewError}
          </div>
        ) : !activeTab ? (
          <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-white/50">
            The sovereign reviewer waits for the active editor tab and inspects it locally through the Rust core.
          </div>
        ) : topReviewFindings.length > 0 ? (
          <div className="space-y-2">
            {topReviewFindings.map((finding, index) => (
              <div key={`${finding.title}-${finding.line}-${index}`} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{finding.title}</div>
                  <div className="text-[10px] uppercase tracking-widest text-amber-300">
                    {REVIEW_SEVERITY_LABELS[finding.severity]}
                  </div>
                </div>
                <div className="text-[10px] text-white/35 uppercase mt-1">
                  {REVIEW_CATEGORY_LABELS[finding.category]} • line {finding.line}
                </div>
                <div className="text-[11px] text-white/65 mt-2">{finding.detail}</div>
                <div className="mt-2 rounded border border-white/10 bg-black/30 px-2 py-1 text-[11px] font-mono text-white/60">
                  {finding.evidence}
                </div>
              </div>
            ))}
          </div>
        ) : activeTab ? (
          <div className="rounded-lg border border-neon-green/20 bg-neon-green/5 p-3 text-xs text-neon-green">
            No external connection or telemetry indicators were detected in the active source file.
          </div>
        ) : null}
      </div>

      {/* Evidence Locker */}
      <div className="bg-white/5 p-4 rounded-xl border border-white/5 relative group cursor-pointer overflow-hidden transition-colors hover:border-red-500/30">
        <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="text-[10px] text-red-400 uppercase tracking-widest font-mono flex items-center gap-2">
            <Lock size={10} /> Evidence Locker
          </div>
          <FileText className="w-3 h-3 text-red-400" />
        </div>
        <div className="text-sm font-bold text-white relative z-10">Case #403: HILO V2</div>
        <div className="text-[10px] text-white/40 mt-1 relative z-10">Recovery Evidence Letter (PDF)</div>
        <div className="text-[9px] text-white/25 mt-1 relative z-10">{CASE_403_ARCHIVE_NOTE}</div>
        <a href="https://ppl-ai-code-interpreter-files.s3.amazonaws.com/b0ac5bdf-ab06-443c-ab10-efe880dea116/0566a53c-90e1-4215-a7d8-6ae2c3ed4e76/HILO_V2_RECOVERY_EVIDENCE_LETTER.pdf?AWSAccessKeyId=ASIA2F3EMEYEUE6TCBQQ&Signature=NVa1I7d5yITBwv3uf3IuB1X7Nac%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEKv%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCVlU7zhDqXjmTZqaTwJd57E8qknwJs1kM2IMvkpKiuUgIhALd%2BWXcSJFjclZ1vTWCP4TCRnZGGzlDiLyxFX00LxCKqKvMECHQQARoMNjk5NzUzMzA5NzA1IgyydHhSI%2BhYnQnK8Uwq0ASCRGnThfi%2BEeTCNx0ili5UTXt7IqZbNA7897NDdzyjPgmdH3NK1iqNc%2B4cpjt1WBXSKmvrQ4RfloSbfA%2BJOwh3TJiKRNlOWUX%2BgIsRcqHDqM0JjBZJYNcqkQ6Cf77q1LabdaAng3JNJafjGg6OtgevSxquEoi3DN1CZlBZnNIR1pgijUw7n9XyCHQDJfNkZ0xk%2BfXQCjiVEK3s0scoHnmHdY5PP66xVuOrUOTeHHjdIzh0u%2FBToeTxMkf6%2BYoCjHSKY0JOp2pJfYxyTZ%2Byf3uw8CKdTMyLU9X5rrpe29472d9ZQEVzeXioOgM59kC8syTo0oEGSNu58P4b9UAyGg3nGIyxok8Y6Z8%2FqS5rzIZleSEq9309DjzN7cEvbsvyOiA4JRuJjb2VyH9xTDmHeY0Fd1n%2Bv62ARqBadXHhsXA7jJ%2F7lZXaI4SbhkvVy7CfpzdP5wWhrL5Aw6B9kV1JjFGx7QUsnVIUpO%2B61q0pneoSDDTq7xKZYJdq%2FK7KaHMBc3E3qfcklZgRygXsUt4WxTntR6TSJ3maDGCC%2BhDGD8OsUfhl1Lwofh6hLwZwgtMuCBwxPX65NC%2BNSG9uKh5c%2BKQ50Y8pEV8rHzQzXNiV9qwV4aS8%2BJCWXl3Y6Pnzv6vOfOiJhedrm0AoGTG8O%2FcBEj%2F9hnkZnWA0HJUompq9PsAHctIgGIcNumo7exjQX8try2X%2FssA9j7V0jCkNuxuyghhZxQKanazIHdH9FPEQQjECFIetsnT8dSh%2FUQeSGrDSvo58X84qWbR%2Bj6FUYIDb%2BfdsMNDSgs4GOpcBhmjxQV8jQFyc%2Bv07Jx%2Fq6UPr0UqwDP9u9OhpUipUwU2ZQ%2Bmzun62%2FxNm4y81unzIJDRuJmAk%2BBx5JW9PHsoW2YKhvtYyxsz6kfcpJlcX9yAmcOX2L0Cu4pKV8VRF%2FNV%2FQyK1R2iPMwRR9BZagSYpD8rLW24O3Vx9EYGlCNoKnDnjdXeLo0vpRBQSz4uAg3CIP464X2eNhg%3D%3D&Expires=1774238449" target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-20" />
      </div>
    </div>
  </div>
);
};
