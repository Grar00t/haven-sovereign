import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useIDEStore } from '../useIDEStore';
import { niyahEngine } from '../engine/NiyahEngine';
import type { IntentGraphNode, IntentGraphEdge, NiyahDomain } from '../engine/NiyahEngine';
import {
  Network, Maximize2, Minimize2, ZoomIn, ZoomOut,
  Target, Code2, Shield, BookOpen, Briefcase,
  Palette, Server, HelpCircle, Activity, Download,
  Filter, Clock, Brain,
} from 'lucide-react';

// ── Domain Colours ─────────────────────────────────────────────────

const DOMAIN_COLOURS: Record<NiyahDomain, string> = {
  code: '#3b82f6',
  content: '#f59e0b',
  security: '#ef4444',
  infrastructure: '#8b5cf6',
  creative: '#ec4899',
  business: '#10b981',
  education: '#06b6d4',
  datascience: '#22d3ee',
  general: '#6b7280',
};

const DOMAIN_ICONS: Record<NiyahDomain, React.ElementType> = {
  code: Code2,
  content: Target,
  security: Shield,
  infrastructure: Server,
  creative: Palette,
  business: Briefcase,
  education: BookOpen,
  datascience: Brain,
  general: HelpCircle,
};

const EDGE_COLOURS: Record<string, string> = {
  context: '#f59e0b',
  root: '#3b82f6',
  domain: '#6b728080',
  temporal: '#6b728040',
};

const EDGE_TYPES = ['context', 'root', 'domain', 'temporal'] as const;
const MAX_VISIBLE_NODES = 200;

// ── Canonical layout canvas (stable, zoom-independent) ──────────────

const CANVAS_W = 1000;
const CANVAS_H = 1000;

// ── Force-directed layout (simple spring model) ─────────────────────

interface LayoutNode extends IntentGraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

function computeLayout(
  nodes: IntentGraphNode[],
  edges: IntentGraphEdge[],
): LayoutNode[] {
  if (nodes.length === 0) return [];

  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;

  const layoutNodes: LayoutNode[] = nodes.map((n, i) => {
    const angle = (i / nodes.length) * Math.PI * 2;
    const r = Math.min(CANVAS_W, CANVAS_H) * 0.35;
    return {
      ...n,
      x: cx + Math.cos(angle) * r + (Math.random() - 0.5) * 20,
      y: cy + Math.sin(angle) * r + (Math.random() - 0.5) * 20,
      vx: 0,
      vy: 0,
      radius: 14 + Math.min(n.sessionCount * 3, 12),
    };
  });

  // Index for fast edge lookup
  const nodeIdx = new Map<string, number>();
  layoutNodes.forEach((n, i) => nodeIdx.set(n.id, i));

  // Run ~80 iterations of a simple force-directed algorithm
  const iterations = 80;
  const repulsion = 6000;
  const springLength = 90;
  const springK = 0.04;
  const damping = 0.85;
  const gravity = 0.02;

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all pairs (O(n^2) — fine for <100 nodes)
    for (let i = 0; i < layoutNodes.length; i++) {
      for (let j = i + 1; j < layoutNodes.length; j++) {
        const a = layoutNodes[i];
        const b = layoutNodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        const distSq = dx * dx + dy * dy + 1;
        const force = repulsion / distSq;
        const dist = Math.sqrt(distSq);
        dx /= dist;
        dy /= dist;
        a.vx += dx * force;
        a.vy += dy * force;
        b.vx -= dx * force;
        b.vy -= dy * force;
      }
    }

    // Spring attraction along edges (indexed lookup)
    for (const e of edges) {
      const ai = nodeIdx.get(e.source);
      const bi = nodeIdx.get(e.target);
      if (ai === undefined || bi === undefined) continue;
      const a = layoutNodes[ai];
      const b = layoutNodes[bi];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
      const displacement = dist - springLength;
      const force = springK * displacement * e.strength;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    // Gravity towards center
    for (const n of layoutNodes) {
      n.vx += (cx - n.x) * gravity;
      n.vy += (cy - n.y) * gravity;
    }

    // Apply velocities with damping
    for (const n of layoutNodes) {
      n.vx *= damping;
      n.vy *= damping;
      n.x += n.vx;
      n.y += n.vy;
      // Clamp to bounds
      n.x = Math.max(n.radius + 8, Math.min(CANVAS_W - n.radius - 8, n.x));
      n.y = Math.max(n.radius + 8, Math.min(CANVAS_H - n.radius - 8, n.y));
    }
  }

  return layoutNodes;
}

// ── IntentGraph Component ───────────────────────────────────────────

export function IntentGraph({ height: propHeight }: { height?: number }) {
  const { currentTheme } = useIDEStore();
  const niyahVector = useIDEStore(s => s.niyahVector);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [niyahHighlight, setNiyahHighlight] = useState(false);

  // Edge type filter
  const [edgeFilter, setEdgeFilter] = useState<Set<string>>(new Set(EDGE_TYPES));
  const [showFilter, setShowFilter] = useState(false);

  // Timeline filter (0 = show all, else ms cutoff from now)
  const [timeRange, setTimeRange] = useState(0);

  // Drag state — load persisted overrides from localStorage
  const [dragging, setDragging] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [posOverrides, setPosOverrides] = useState<Map<string, { x: number; y: number }>>(() => {
    try {
      const stored = localStorage.getItem('haven-intent-graph-pos');
      if (stored) {
        const parsed: [string, { x: number; y: number }][] = JSON.parse(stored);
        return new Map(parsed);
      }
    } catch { /* ignore */ }
    return new Map();
  });

  // Persist posOverrides to localStorage on change (debounced)
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (posOverrides.size === 0) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      try {
        localStorage.setItem('haven-intent-graph-pos', JSON.stringify([...posOverrides.entries()]));
      } catch { /* localStorage full — ignore */ }
    }, 500);
    return () => { if (persistTimer.current) clearTimeout(persistTimer.current); };
  }, [posOverrides]);

  const graphHeight = expanded ? 500 : (propHeight || 280);
  const graphWidth = 320;

  // ── Data ─────────────────────────────────────────────────────
  const rawData = useMemo(() => niyahEngine.getIntentGraphData(), []);
  const sessionCount = useMemo(() => niyahEngine.getMemoryStats().sessions, []);

  // Filtered data (timeline + node cap + edge filter)
  const filteredData = useMemo(() => {
    let nodes = rawData.nodes;
    let edges = rawData.edges;

    if (timeRange > 0) {
      const cutoff = Date.now() - timeRange;
      const nodeIds = new Set(nodes.filter(n => n.timestamp >= cutoff).map(n => n.id));
      nodes = nodes.filter(n => nodeIds.has(n.id));
      edges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
    }

    if (nodes.length > MAX_VISIBLE_NODES) {
      const sorted = [...nodes].sort((a, b) => b.timestamp - a.timestamp);
      const kept = new Set(sorted.slice(0, MAX_VISIBLE_NODES).map(n => n.id));
      nodes = nodes.filter(n => kept.has(n.id));
      edges = edges.filter(e => kept.has(e.source) && kept.has(e.target));
    }

    edges = edges.filter(e => edgeFilter.has(e.type));
    return { nodes, edges, clusters: rawData.clusters };
  }, [rawData, timeRange, edgeFilter, sessionCount]);

  const isTruncated = rawData.nodes.length > MAX_VISIBLE_NODES && timeRange === 0;

  // ── Layout (stable canvas, computed once per data change) ───
  const baseLayout = useMemo(
    () => computeLayout(filteredData.nodes, filteredData.edges),
    [filteredData],
  );

  // Apply drag overrides
  const layout = useMemo(() => {
    if (posOverrides.size === 0) return baseLayout;
    return baseLayout.map(n => {
      const ov = posOverrides.get(n.id);
      return ov ? { ...n, x: ov.x, y: ov.y } : n;
    });
  }, [baseLayout, posOverrides]);

  // Scale: map CANVAS → display viewport
  const scaleX = (graphWidth * zoom) / CANVAS_W;
  const scaleY = (graphHeight * zoom) / CANVAS_H;
  const scale = Math.min(scaleX, scaleY);

  // Indexed layout lookup (O(1) instead of .find())
  const layoutMap = useMemo(() => {
    const m = new Map<string, typeof layout[number]>();
    for (const n of layout) m.set(n.id, n);
    return m;
  }, [layout]);

  const hoveredNode = useMemo(() => hovered ? layoutMap.get(hovered) ?? null : null, [layoutMap, hovered]);
  const selectedNode = useMemo(() => selected ? layoutMap.get(selected) ?? null : null, [layoutMap, selected]);

  // ── NiyahVector highlighting ─────────────────────────────────
  const niyahMatchingIds = useMemo(() => {
    if (!niyahHighlight || !niyahVector) return new Set<string>();
    const ids = new Set<string>();
    const vec = niyahVector.vector;
    for (const node of filteredData.nodes) {
      const domainMatch = vec.domain && node.domain === vec.domain;
      const toneMatch = vec.tone && node.tone === vec.tone;
      const dialectMatch = vec.dialect && node.dialect === vec.dialect;
      // Match if domain matches, or if 2+ fields match
      let matchCount = 0;
      if (domainMatch) matchCount++;
      if (toneMatch) matchCount++;
      if (dialectMatch) matchCount++;
      if (matchCount >= 1) ids.add(node.id);
    }
    return ids;
  }, [niyahHighlight, niyahVector, filteredData.nodes]);

  const connectedEdges = useMemo(() => {
    if (!hovered) return new Set<string>();
    const set = new Set<string>();
    for (const e of filteredData.edges) {
      if (e.source === hovered || e.target === hovered) {
        set.add(e.source);
        set.add(e.target);
      }
    }
    return set;
  }, [filteredData.edges, hovered]);

  const handleZoomIn = useCallback(() => setZoom(z => Math.min(z + 0.2, 2.5)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(z - 0.2, 0.5)), []);

  const toggleEdgeType = useCallback((type: string) => {
    setEdgeFilter(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  // ── Drag handlers ───────────────────────────────────────────
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDragging(nodeId);
    const node = layoutMap.get(nodeId);
    if (!node || !svgRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - svgRect.left - node.x * scale,
      y: e.clientY - svgRect.top - node.y * scale,
    };
  }, [layout, layoutMap, scale]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      const svgRect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - svgRect.left - dragOffset.current.x) / scale;
      const y = (e.clientY - svgRect.top - dragOffset.current.y) / scale;
      setPosOverrides(prev => {
        const next = new Map(prev);
        next.set(dragging, {
          x: Math.max(20, Math.min(CANVAS_W - 20, x)),
          y: Math.max(20, Math.min(CANVAS_H - 20, y)),
        });
        return next;
      });
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, scale]);

  // ── Export PNG ──────────────────────────────────────────────
  const handleExportPNG = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const svgStr = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = currentTheme.bg;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
      const a = document.createElement('a');
      a.download = `niyah-intent-graph-${Date.now()}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
  }, [currentTheme.bg]);

  // ── Empty state ───────────────────────────────────────────────
  if (filteredData.nodes.length === 0) {
    return (
      <div
        className="rounded-lg border flex flex-col items-center justify-center py-6 px-4"
        style={{ backgroundColor: currentTheme.bg, borderColor: currentTheme.border, minHeight: 140 }}
      >
        <Network size={28} style={{ color: currentTheme.accent, opacity: 0.3 }} />
        <div className="text-[11px] mt-2 text-center" style={{ color: currentTheme.textMuted }}>
          No intents yet. Start a Niyah session to build the graph.
        </div>
        <div className="text-[9px] mt-1 font-mono" style={{ color: currentTheme.accent + '60' }}>
          "كل نية ستصبح عقدة في خريطة عقلك"
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="rounded-lg border overflow-hidden" style={{ backgroundColor: currentTheme.bg, borderColor: currentTheme.accent + '30' }}>

      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-2 py-1 border-b flex-wrap" style={{ borderColor: currentTheme.border + '60' }}>
        <Network size={11} style={{ color: currentTheme.accent }} />
        <span className="text-[10px] font-semibold flex-1" style={{ color: currentTheme.accent }}>
          Intent Graph
        </span>
        <span className="text-[9px] font-mono" style={{ color: currentTheme.textMuted }}>
          {filteredData.nodes.length}N {filteredData.edges.length}E
        </span>
        <button onClick={() => setShowFilter(!showFilter)} className="p-0.5 rounded hover:brightness-125" title="Filter edges" aria-label="Filter edges">
          <Filter size={11} style={{ color: showFilter ? currentTheme.accent : currentTheme.textMuted }} />
        </button>
        <button
          onClick={() => setNiyahHighlight(!niyahHighlight)}
          className="p-0.5 rounded hover:brightness-125"
          title={niyahVector ? `Highlight Niyah: ${niyahVector.vector.domain} / ${niyahVector.vector.tone}` : 'No active Niyah vector'}
          aria-label="Highlight by Niyah vector"
          aria-pressed={niyahHighlight}
        >
          <Brain size={11} style={{ color: niyahHighlight && niyahVector ? '#a855f7' : currentTheme.textMuted }} />
        </button>
        <button onClick={handleExportPNG} className="p-0.5 rounded hover:brightness-125" title="Export as PNG" aria-label="Export as PNG">
          <Download size={11} style={{ color: currentTheme.textMuted }} />
        </button>
        <button onClick={handleZoomOut} className="p-0.5 rounded hover:brightness-125" title="Zoom out" aria-label="Zoom out">
          <ZoomOut size={11} style={{ color: currentTheme.textMuted }} />
        </button>
        <span className="text-[9px] font-mono w-7 text-center" style={{ color: currentTheme.textMuted }}>
          {(zoom * 100).toFixed(0)}%
        </span>
        <button onClick={handleZoomIn} className="p-0.5 rounded hover:brightness-125" title="Zoom in" aria-label="Zoom in">
          <ZoomIn size={11} style={{ color: currentTheme.textMuted }} />
        </button>
        <button onClick={() => setExpanded(!expanded)} className="p-0.5 rounded hover:brightness-125" title={expanded ? 'Collapse' : 'Expand'} aria-label={expanded ? 'Collapse graph' : 'Expand graph'}>
          {expanded ? <Minimize2 size={11} style={{ color: currentTheme.textMuted }} /> : <Maximize2 size={11} style={{ color: currentTheme.textMuted }} />}
        </button>
      </div>

      {/* ── Niyah Vector Highlight Bar ─────────────────────── */}
      {niyahHighlight && niyahVector && (
        <div className="flex items-center gap-2 px-2 py-1 border-b text-[9px]" style={{ borderColor: '#a855f730', backgroundColor: '#a855f710' }}>
          <Brain size={9} style={{ color: '#a855f7' }} />
          <span style={{ color: '#a855f7' }}>NIYAH VECTOR:</span>
          <span className="font-mono" style={{ color: '#d8b4fe' }}>{niyahVector.vector.domain}</span>
          <span className="opacity-40">·</span>
          <span className="font-mono" style={{ color: '#d8b4fe' }}>{niyahVector.vector.tone}</span>
          <span className="opacity-40">·</span>
          <span className="font-mono" style={{ color: '#d8b4fe' }}>{niyahVector.vector.dialect}</span>
          <span className="ml-auto font-mono" style={{ color: '#a855f7' }}>{niyahMatchingIds.size} matches</span>
        </div>
      )}
      {niyahHighlight && !niyahVector && (
        <div className="flex items-center gap-2 px-2 py-1 border-b text-[9px]" style={{ borderColor: '#a855f730', backgroundColor: '#a855f708' }}>
          <Brain size={9} style={{ color: '#666' }} />
          <span style={{ color: '#666' }}>No active Niyah vector. Run a <code className="font-mono">niyah</code> command first.</span>
        </div>
      )}

      {/* ── Edge Filter Panel ─────────────────────────────────── */}
      {showFilter && (
        <div className="flex items-center gap-2 px-2 py-1.5 border-b flex-wrap" style={{ borderColor: currentTheme.border + '40' }}>
          {EDGE_TYPES.map(type => (
            <button
              key={type}
              onClick={() => toggleEdgeType(type)}
              className="text-[9px] px-1.5 py-0.5 rounded font-mono transition-colors"
              style={{
                backgroundColor: edgeFilter.has(type) ? EDGE_COLOURS[type] + '30' : 'transparent',
                color: edgeFilter.has(type) ? EDGE_COLOURS[type].replace(/[0-9a-f]{2}$/i, '') || currentTheme.text : currentTheme.textMuted,
                border: `1px solid ${edgeFilter.has(type) ? EDGE_COLOURS[type] : currentTheme.border + '40'}`,
              }}
              aria-pressed={edgeFilter.has(type)}
              aria-label={`Toggle ${type} edges`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* ── Timeline Slider ───────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-2 py-1 border-b" style={{ borderColor: currentTheme.border + '30' }}>
        <Clock size={9} style={{ color: currentTheme.textMuted }} />
        <input
          type="range"
          min={0} max={4} step={1}
          value={timeRange === 0 ? 0 : timeRange <= 3600000 ? 1 : timeRange <= 86400000 ? 2 : timeRange <= 604800000 ? 3 : 4}
          onChange={(e) => {
            const map = [0, 3600000, 86400000, 604800000, 2592000000];
            setTimeRange(map[Number(e.target.value)]);
          }}
          className="flex-1 h-1 accent-current"
          style={{ accentColor: currentTheme.accent }}
          aria-label="Timeline filter"
        />
        <span className="text-[8px] font-mono w-8" style={{ color: currentTheme.textMuted }}>
          {timeRange === 0 ? 'All' : timeRange <= 3600000 ? '1h' : timeRange <= 86400000 ? '1d' : timeRange <= 604800000 ? '1w' : '30d'}
        </span>
      </div>

      {/* ── Truncation warning ────────────────────────────────── */}
      {isTruncated && (
        <div className="text-[9px] px-2 py-1 text-center" style={{ backgroundColor: '#f59e0b15', color: '#f59e0b' }}>
          Showing {MAX_VISIBLE_NODES} of {rawData.nodes.length} nodes. Use timeline to narrow.
        </div>
      )}

      {/* ── SVG Canvas (stable viewBox, zoom via CSS scale) ───── */}
      <div style={{ width: graphWidth, height: graphHeight, overflow: 'hidden', position: 'relative' }}>
        <svg
          ref={svgRef}
          width={CANVAS_W}
          height={CANVAS_H}
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          style={{
            cursor: dragging ? 'grabbing' : 'crosshair',
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
          }}
          onClick={() => setSelected(null)}
        >
          <defs>
            <pattern id="niyah-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke={currentTheme.border + '25'} strokeWidth="0.5" />
            </pattern>
            <filter id="niyah-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#niyah-grid)" />

          {/* ── Edges ──────────────────────────────────────────── */}
          {filteredData.edges.map((e, i) => {
            const a = layoutMap.get(e.source);
            const b = layoutMap.get(e.target);
            if (!a || !b) return null;

            const isHighlighted = hovered && (connectedEdges.has(e.source) && connectedEdges.has(e.target) && (e.source === hovered || e.target === hovered));
            const opacity = hovered ? (isHighlighted ? 0.8 : 0.1) : (e.strength * 0.6 + 0.1);

            return (
              <line
                key={`edge-${i}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={EDGE_COLOURS[e.type] || currentTheme.border}
                strokeWidth={isHighlighted ? 3 : Math.max(0.5, e.strength * 2)}
                opacity={opacity}
                strokeDasharray={e.type === 'temporal' ? '4,4' : e.type === 'domain' ? '8,4' : undefined}
              />
            );
          })}

          {/* ── Nodes (draggable) ─────────────────────────────── */}
          {layout.map((node) => {
            const isHovered = node.id === hovered;
            const isSelected = node.id === selected;
            const isDragged = node.id === dragging;
            const isConnected = hovered ? connectedEdges.has(node.id) : false;
            const isNiyahMatch = niyahHighlight && niyahMatchingIds.has(node.id);
            const dimmed = (hovered && !isHovered && !isConnected) || (niyahHighlight && niyahMatchingIds.size > 0 && !isNiyahMatch && !isHovered);
            const colour = DOMAIN_COLOURS[node.domain];
            const r = node.radius;
            const glowFilter = isNiyahMatch ? 'url(#niyah-glow)' : isHovered ? 'url(#niyah-glow)' : undefined;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                style={{
                  cursor: isDragged ? 'grabbing' : 'grab',
                  opacity: dimmed ? 0.2 : 1,
                  transition: isDragged ? 'none' : 'opacity 0.2s',
                }}
                onMouseEnter={() => !dragging && setHovered(node.id)}
                onMouseLeave={() => !dragging && setHovered(null)}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onClick={(e) => { e.stopPropagation(); setSelected(node.id === selected ? null : node.id); }}
                filter={glowFilter}
                tabIndex={0}
                role="button"
                aria-label={`${node.label} — ${node.domain}, ${(node.confidence * 100).toFixed(0)}% confidence`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(node.id === selected ? null : node.id);
                  }
                }}
              >
                <circle
                  r={r + 3} fill="none"
                  stroke={isNiyahMatch ? '#a855f7' : node.alignment >= 90 ? '#22c55e' : node.alignment >= 70 ? '#f59e0b' : '#ef4444'}
                  strokeWidth={isSelected || isNiyahMatch ? 2.5 : 1}
                  opacity={isHovered || isSelected || isNiyahMatch ? 0.8 : 0.25}
                />
                <circle r={r} fill={colour + '20'} stroke={colour} strokeWidth={isHovered || isSelected ? 2 : 1} />
                <circle r={r - 3} fill={colour + (isHovered ? '40' : '15')} stroke="none" />
                <text
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={r > 18 ? 10 : 8} fill={colour} fontWeight={600}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {node.domain.slice(0, 3).toUpperCase()}
                </text>
                {(isHovered || isSelected) && (
                  <text
                    y={r + 14} textAnchor="middle" fontSize={9}
                    fill={currentTheme.textMuted} fontFamily="JetBrains Mono, monospace"
                  >
                    {(node.confidence * 100).toFixed(0)}%
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Domain Legend ────────────────────────────────────── */}
          <g transform={`translate(12, ${CANVAS_H - (filteredData.clusters.length * 22 + 16)})`}>
            {filteredData.clusters.map((c, i) => (
              <g key={c.domain} transform={`translate(0, ${i * 22})`}>
                <circle r={6} cx={6} cy={0} fill={DOMAIN_COLOURS[c.domain]} opacity={0.7} />
                <text x={18} y={0} dominantBaseline="central" fontSize={12} fill={currentTheme.textMuted} fontFamily="Inter, sans-serif">
                  {c.domain} ({c.count})
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* ── Detail Card ────────────────────────────────────────── */}
      {(selectedNode || hoveredNode) && (
        <IntentDetailCard
          node={(selectedNode || hoveredNode)!}
          theme={currentTheme}
          edges={filteredData.edges}
          nodes={filteredData.nodes}
        />
      )}
    </div>
  );
}

// ── Detail Card ─────────────────────────────────────────────────────

const IntentDetailCard = React.memo(function IntentDetailCard({
  node,
  theme,
  edges,
  nodes,
}: {
  node: LayoutNode | IntentGraphNode;
  theme: { accent: string; text: string; textMuted: string; bg: string; border: string };
  edges: IntentGraphEdge[];
  nodes: IntentGraphNode[];
}) {
  const colour = DOMAIN_COLOURS[node.domain];
  const Icon = DOMAIN_ICONS[node.domain];

  // Count connections
  const connections = edges.filter(e => e.source === node.id || e.target === node.id);
  const connectedIds = new Set(connections.map(e => e.source === node.id ? e.target : e.source));
  const connectedNodes = nodes.filter(n => connectedIds.has(n.id));

  const timeAgo = useMemo(() => {
    const diff = Date.now() - node.timestamp;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }, [node.timestamp]);

  return (
    <div
      className="px-3 py-2 border-t space-y-1.5"
      style={{ borderColor: theme.border + '60', backgroundColor: theme.bg }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded flex items-center justify-center"
          style={{ backgroundColor: colour + '20' }}
        >
          <Icon size={12} style={{ color: colour }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold truncate" style={{ color: theme.text }} dir="auto">
            {node.label}
          </div>
          <div className="text-[9px]" style={{ color: theme.textMuted }}>
            {node.domain} · {node.dialect} · {node.tone} · {timeAgo}
          </div>
        </div>
        <div
          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: node.alignment >= 90 ? '#22c55e15' : node.alignment >= 70 ? '#f59e0b15' : '#ef444415',
            color: node.alignment >= 90 ? '#22c55e' : node.alignment >= 70 ? '#f59e0b' : '#ef4444',
          }}
        >
          {node.alignment}/100
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-[9px]" style={{ color: theme.textMuted }}>
        <span className="flex items-center gap-1">
          <Activity size={9} /> {(node.confidence * 100).toFixed(0)}% conf
        </span>
        <span className="flex items-center gap-1">
          <Network size={9} /> {connections.length} link{connections.length !== 1 ? 's' : ''}
        </span>
        {node.roots.length > 0 && (
          <span className="font-mono" dir="rtl">
            {node.roots.slice(0, 2).join(' · ')}
          </span>
        )}
      </div>

      {/* Connected nodes (max 3) */}
      {connectedNodes.length > 0 && (
        <div className="space-y-0.5">
          <div className="text-[9px] font-semibold" style={{ color: theme.textMuted }}>Connected:</div>
          {connectedNodes.slice(0, 3).map(cn => {
            const edge = connections.find(e => e.source === cn.id || e.target === cn.id);
            return (
              <div key={cn.id} className="flex items-center gap-1.5 text-[9px]" style={{ color: theme.textMuted }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DOMAIN_COLOURS[cn.domain] }} />
                <span className="truncate flex-1" dir="auto">{cn.label.slice(0, 30)}</span>
                {edge && (
                  <span className="font-mono text-[8px] px-1 rounded" style={{ backgroundColor: EDGE_COLOURS[edge.type] + '20', color: EDGE_COLOURS[edge.type] }}>
                    {edge.type}
                  </span>
                )}
              </div>
            );
          })}
          {connectedNodes.length > 3 && (
            <div className="text-[8px]" style={{ color: theme.accent }}>
              +{connectedNodes.length - 3} more
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ── Default export for React.lazy ───────────────────────────────────

export default IntentGraph;
