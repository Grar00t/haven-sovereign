import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
// import { SovereignBridge } from '../../ide/engine/SovereignBridge'; // Note: Node native modules like child_process are for Electron/Server-side

export const SystemPulse = () => {
  const [cpu, setCpu] = useState(12);
  const [mem, setMem] = useState(41);
  const [net, setNet] = useState('CONNECTED');
  const [linkStatus, setLinkStatus] = useState('SYNCING');
  const [isBooting, setIsBooting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(prev => Math.min(100, Math.max(5, prev + (Math.random() - 0.5) * 10)));
      setMem(prev => Math.min(64, Math.max(30, prev + (Math.random() - 0.5) * 2)));
      if (isBooting) setLinkStatus('NODE_BOOT_PROGRESS_82%');
      else setLinkStatus(Math.random() > 0.9 ? 'UPLINK ACTIVE' : 'SYNCING');
    }, 1000);
    return () => clearInterval(interval);
  }, [isBooting]);

  const handleBoot = () => {
    setIsBooting(true);
    // Note: Since this is a browser UI, we'd normally call an API endpoint 
    // that runs SovereignBridge.startSovereignVM() on the server/host.
    console.log("[SYSTEM] Sending boot sequence to D:\\SOVEREIGN_LAB...");
    setTimeout(() => setIsBooting(false), 5000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-4 px-4 py-2 rounded-full glass-premium border-l-2 border-neon-green/50 text-[10px] font-mono tracking-wider text-neon-green/80">
      
      {/* Link to D: Drive */}
      <div className="flex items-center gap-2 border-r border-white/10 pr-4">
        <div className="relative w-2 h-2">
            <span className={`absolute inline-flex h-full w-full rounded-full ${isBooting ? 'bg-sovereign-gold' : 'bg-neon-green'} opacity-75 animate-ping`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isBooting ? 'bg-sovereign-gold' : 'bg-neon-green'}`}></span>
        </div>
        <span className="opacity-80">D:\SOVEREIGN_LAB</span>
        <button 
            onClick={handleBoot}
            disabled={isBooting}
            className="text-white font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10 hover:bg-neon-green hover:text-black transition-all cursor-pointer"
        >
            {isBooting ? 'BOOTING...' : 'BOOT NODE'}
        </button>
      </div>

      {/* System Stats */}
      <div className="flex gap-4">
        <div className="flex flex-col items-end">
            <span className="text-[8px] opacity-50 uppercase tracking-tighter">CPU_LOAD</span>
            <span className="font-bold text-white">{cpu.toFixed(1)}%</span>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-[8px] opacity-50 uppercase tracking-tighter">RAM_PHYS</span>
            <span className="font-bold text-white">{mem.toFixed(1)}GB</span>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-[8px] opacity-50 uppercase tracking-tighter">NET_SOV</span>
            <span className={`font-bold ${isBooting ? 'text-sovereign-gold' : 'text-neon-green'}`}>{net}</span>
        </div>
      </div>
    </div>
  );
};
