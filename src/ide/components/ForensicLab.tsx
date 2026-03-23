import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Key, Lock, Activity, RefreshCw } from 'lucide-react';
import { sovereignSessionCleaner } from '../engine/SovereignSessionCleaner';
import { useStore } from '../../store/useStore';

export const ForensicLab = () => {
  const { isSovereign } = useStore();
  const [stats, setStats] = useState({ chainIndex: 0, sessionCount: 0, active: false });
  const [keys, setKeys] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = sovereignSessionCleaner.getRatchetState();
      setStats(current);

      // Update visual key chain
      if (current.chainIndex > 0) {
        setKeys(prev => {
          // Keep last 8 keys
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
      </div>
    </div>
  );
};