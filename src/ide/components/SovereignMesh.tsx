// ══════════════════════════════════════════════════════════════
// SovereignMesh — Force-directed mesh network topology
// Pure SVG + motion — Zero D3. Zero cloud. Zero dependency.
// Ported from HaveMesh → HAVEN OFFICIAL by أبو خوارزم
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';

interface MeshNode {
  id: string;
  label: string;
  group: 'core' | 'city' | 'user';
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface MeshLink {
  source: string;
  target: string;
  strength: number;
}

const INITIAL_NODES: Omit<MeshNode, 'x' | 'y' | 'vx' | 'vy'>[] = [
  { id: 'CORE', label: 'DRAGON_CORE', group: 'core' },
  { id: 'RUH', label: 'RIYADH_NODE', group: 'city' },
  { id: 'JED', label: 'JEDDAH_NODE', group: 'city' },
  { id: 'DMM', label: 'DAMMAM_NODE', group: 'city' },
  { id: 'KHO', label: 'KHOBAR_NODE', group: 'city' },
  { id: 'U1', label: 'USER_ALPHA', group: 'user' },
  { id: 'U2', label: 'USER_BRAVO', group: 'user' },
  { id: 'U3', label: 'USER_CHARLIE', group: 'user' },
  { id: 'U4', label: 'USER_DELTA', group: 'user' },
  { id: 'U5', label: 'USER_ECHO', group: 'user' },
];

const LINKS: MeshLink[] = [
  { source: 'CORE', target: 'RUH', strength: 10 },
  { source: 'CORE', target: 'JED', strength: 10 },
  { source: 'CORE', target: 'DMM', strength: 10 },
  { source: 'CORE', target: 'KHO', strength: 8 },
  { source: 'RUH', target: 'U1', strength: 5 },
  { source: 'RUH', target: 'U2', strength: 5 },
  { source: 'JED', target: 'U3', strength: 5 },
  { source: 'DMM', target: 'U4', strength: 5 },
  { source: 'KHO', target: 'U5', strength: 5 },
  { source: 'U1', target: 'U2', strength: 2 },
  { source: 'U3', target: 'U4', strength: 2 },
  { source: 'RUH', target: 'JED', strength: 3 },
  { source: 'DMM', target: 'KHO', strength: 3 },
];

const W = 600, H = 400;

const GROUP_COLORS: Record<string, string> = {
  core: '#00FF00',
  city: '#FFD700',
  user: '#00BFFF',
};

function initNodes(): MeshNode[] {
  const cx = W / 2, cy = H / 2;
  return INITIAL_NODES.map((n, i) => ({
    ...n,
    x: cx + (Math.random() - 0.5) * 300,
    y: cy + (Math.random() - 0.5) * 200,
    vx: 0,
    vy: 0,
  }));
}

export const SovereignMesh = () => {
  const [nodes, setNodes] = useState<MeshNode[]>(initNodes);
  const [dragging, setDragging] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [frozen, setFrozen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const frameRef = useRef<number>(0);

  const resetMesh = useCallback(() => {
    setNodes(initNodes());
    setFrozen(false);
  }, []);

  // Simple force simulation
  useEffect(() => {
    if (frozen) return;
    let running = true;

    const tick = () => {
      if (!running) return;

      setNodes(prev => {
        const next = prev.map(n => ({ ...n }));
        const nodeMap = new Map<string, MeshNode>(next.map(n => [n.id, n]));

        // Repulsion between all nodes
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const a = next[i], b = next[j];
            const dx = b.x - a.x, dy = b.y - a.y;
            const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
            const force = 800 / (dist * dist);
            const fx = (dx / dist) * force, fy = (dy / dist) * force;
            a.vx -= fx; a.vy -= fy;
            b.vx += fx; b.vy += fy;
          }
        }

        // Attraction along links
        for (const link of LINKS) {
          const a = nodeMap.get(link.source);
          const b = nodeMap.get(link.target);
          if (!a || !b) continue;
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const target = 80 + (link.strength < 5 ? 40 : 0);
          const force = (dist - target) * 0.008;
          const fx = (dx / Math.max(dist, 1)) * force;
          const fy = (dy / Math.max(dist, 1)) * force;
          a.vx += fx; a.vy += fy;
          b.vx -= fx; b.vy -= fy;
        }

        // Center gravity
        for (const n of next) {
          n.vx += (W / 2 - n.x) * 0.001;
          n.vy += (H / 2 - n.y) * 0.001;
        }

        // Apply velocity with damping
        for (const n of next) {
          if (n.id === dragging) { n.vx = 0; n.vy = 0; continue; }
          n.vx *= 0.85;
          n.vy *= 0.85;
          n.x += n.vx;
          n.y += n.vy;
          // Bounds
          n.x = Math.max(20, Math.min(W - 20, n.x));
          n.y = Math.max(20, Math.min(H - 20, n.y));
        }

        return next;
      });

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(frameRef.current); };
  }, [dragging, frozen]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    setNodes(prev => prev.map(n => n.id === dragging ? { ...n, x, y, vx: 0, vy: 0 } : n));
  }, [dragging]);

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  return (
    <div className="w-full bg-black/60 border border-green-900/20 rounded-lg overflow-hidden relative">
      <div className="absolute top-2 left-3 z-10 flex items-center gap-2">
        <span className="text-[9px] font-bold text-green-500/60 uppercase tracking-[0.3em] font-mono">
          Sovereign_Mesh_Topology
        </span>
      </div>
      <div className="absolute top-2 right-3 z-10 flex items-center gap-1.5">
        <button
          onClick={() => setFrozen(f => !f)}
          className={`text-[8px] px-2 py-0.5 rounded border font-mono transition-all ${
            frozen
              ? 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10'
              : 'border-green-500/20 text-green-500/50 hover:text-green-400'
          }`}
        >
          {frozen ? '■ FROZEN' : '▶ LIVE'}
        </button>
        <button
          onClick={resetMesh}
          className="text-[8px] px-2 py-0.5 rounded border border-white/10 text-white/30 hover:text-white/60 font-mono transition-all"
        >
          RESET
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseUp={() => setDragging(null)}
        onMouseLeave={() => setDragging(null)}
      >
        {/* Grid */}
        <defs>
          <pattern id="mesh-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="0.5" fill="rgba(0,255,0,0.08)" />
          </pattern>
          <filter id="mesh-glow">
            <feGaussianBlur stdDeviation="3" />
            <feComposite in2="SourceGraphic" operator="over" />
          </filter>
        </defs>
        <rect width={W} height={H} fill="url(#mesh-grid)" />

        {/* Links */}
        {LINKS.map((link, i) => {
          const s = nodeMap.get(link.source);
          const t = nodeMap.get(link.target);
          if (!s || !t) return null;
          const isHighlighted = hovered === link.source || hovered === link.target;
          return (
            <line
              key={i}
              x1={s.x} y1={s.y} x2={t.x} y2={t.y}
              stroke={isHighlighted ? '#00FF00' : 'rgba(0,255,0,0.15)'}
              strokeWidth={isHighlighted ? 1.5 : 0.8}
              strokeDasharray={link.strength < 5 ? '4 4' : undefined}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(n => {
          const color = GROUP_COLORS[n.group];
          const r = n.group === 'core' ? 10 : n.group === 'city' ? 7 : 5;
          const isActive = hovered === n.id;
          return (
            <g
              key={n.id}
              onMouseDown={(e) => { e.preventDefault(); setDragging(n.id); }}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'grab' }}
            >
              {/* Glow ring */}
              {isActive && (
                <circle cx={n.x} cy={n.y} r={r + 8} fill="none" stroke={color} strokeWidth="0.5" opacity="0.4" />
              )}
              {/* Pulse for core */}
              {n.group === 'core' && (
                <circle cx={n.x} cy={n.y} r={r + 4} fill="none" stroke={color} strokeWidth="0.5" opacity="0.3">
                  <animate attributeName="r" values={`${r + 2};${r + 12};${r + 2}`} dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Node circle */}
              <circle
                cx={n.x} cy={n.y} r={r}
                fill={color}
                opacity={isActive ? 1 : 0.7}
                filter="url(#mesh-glow)"
              />
              {/* Label */}
              <text
                x={n.x + r + 4} y={n.y + 3}
                fill={isActive ? '#fff' : 'rgba(255,255,255,0.3)'}
                fontSize="8"
                fontFamily="monospace"
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 right-3 flex gap-3 text-[8px] font-mono text-white/30">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00FF00]" />Core</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FFD700]" />City</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00BFFF]" />User</span>
      </div>
    </div>
  );
};
