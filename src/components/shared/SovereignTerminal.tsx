import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';

const COMMANDS = [
  "Initialize Niyah Core...",
  "Loading neural weights from D:\\Sovereign_Lab...",
  "Scanning localized dependencies...",
  "Bridge status: ACTIVE",
  "Checking integrity of /src/components...",
  "Gemini Twin handshake: SUCCESS",
  "Monitoring network traffic: SILENT",
  "System optimal. Waiting for user intent."
];

export const SovereignTerminal = () => {
  const [lines, setLines] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      const cmd = COMMANDS[index % COMMANDS.length];
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLines(prev => [...prev.slice(-8), `[${timestamp}] ${cmd}`]);
      index++;
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.7 }}
      className="fixed bottom-24 left-6 z-40 w-80 font-mono text-[10px] text-neon-green/60 pointer-events-none select-none"
    >
      <div className="bg-black/40 backdrop-blur-sm border border-white/5 rounded-lg p-3 shadow-2xl">
        <div className="flex items-center gap-2 mb-2 opacity-50 border-b border-white/5 pb-1">
          <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
          <span className="ml-auto">SOVEREIGN_LOG</span>
        </div>
        <div className="space-y-1 h-32 overflow-hidden flex flex-col justify-end" ref={scrollRef}>
          {lines.map((line, i) => (
            <motion.div 
              key={i}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="truncate"
            >
              <span className="text-white/30 mr-2">$</span>
              {line}
            </motion.div>
          ))}
          <motion.div 
            animate={{ opacity: [0, 1, 0] }} 
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="w-2 h-4 bg-neon-green/50 mt-1"
          />
        </div>
      </div>
    </motion.div>
  );
};
