// ══════════════════════════════════════════════════════════════
// AmbientPlayer — Sovereign Atmospheric Audio
// Auto-plays "Lux Aeterna" (Requiem for a Dream) as background
// ambiance. Minimal UI: volume slider + mute toggle.
// Built by أبو خوارزم — Sulaiman Alshammari
// ══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Music, Play, Pause } from 'lucide-react';

export function AmbientPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.15); // Start quiet — it's ambiance
  const [expanded, setExpanded] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Create audio element once
  useEffect(() => {
    const audio = new Audio('/lux-aeterna.mp4');
    audio.loop = true;
    audio.volume = volume;
    audio.preload = 'auto';
    audioRef.current = audio;

    audio.addEventListener('play', () => setPlaying(true));
    audio.addEventListener('pause', () => setPlaying(false));

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Auto-play on first user interaction (browser requires gesture)
  useEffect(() => {
    if (hasInteracted) return;

    const handleFirstInteraction = () => {
      setHasInteracted(true);
      const audio = audioRef.current;
      if (audio) {
        audio.volume = volume;
        audio.play().catch(() => {
          // Silently fail — some browsers still block
        });
      }
    };

    // Listen for any user gesture
    const events = ['click', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => document.addEventListener(e, handleFirstInteraction, { once: true }));

    return () => {
      events.forEach(e => document.removeEventListener(e, handleFirstInteraction));
    };
  }, [hasInteracted, volume]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [playing]);

  const toggleMute = useCallback(() => {
    setMuted(m => !m);
  }, []);

  return (
    <div
      className="fixed bottom-4 left-4 z-50 group"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Pill container */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-full
          bg-black/80 backdrop-blur-md border border-[#00ff41]/20
          shadow-[0_0_20px_rgba(0,255,65,0.1)]
          transition-all duration-500 ease-out
          ${expanded ? 'pr-4' : ''}
        `}
      >
        {/* Music icon — always visible */}
        <button
          onClick={togglePlay}
          className="relative flex items-center justify-center w-8 h-8 rounded-full
                     hover:bg-[#00ff41]/10 transition-colors"
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <>
              <Pause size={14} className="text-[#00ff41]" />
              {/* Pulsing ring when playing */}
              <span className="absolute inset-0 rounded-full border border-[#00ff41]/30 animate-ping" />
            </>
          ) : (
            <Play size={14} className="text-[#00ff41]/60" />
          )}
        </button>

        {/* Track name — shows on hover */}
        {expanded && (
          <span className="text-[10px] text-[#00ff41]/60 font-mono whitespace-nowrap select-none">
            Lux Aeterna
          </span>
        )}

        {/* Volume controls — show on hover */}
        {expanded && (
          <>
            <button
              onClick={toggleMute}
              className="flex items-center justify-center w-6 h-6 rounded-full
                         hover:bg-[#00ff41]/10 transition-colors"
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? (
                <VolumeX size={12} className="text-[#00ff41]/40" />
              ) : (
                <Volume2 size={12} className="text-[#00ff41]/60" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={muted ? 0 : volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (v > 0 && muted) setMuted(false);
              }}
              className="w-16 h-1 accent-[#00ff41] cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
              title={`Volume: ${Math.round(volume * 200)}%`}
            />
          </>
        )}

        {/* Minimal indicator when collapsed */}
        {!expanded && playing && (
          <div className="flex items-center gap-[2px] h-3">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-[2px] bg-[#00ff41]/40 rounded-full"
                style={{
                  animation: `ambient-bar 1.2s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* CSS animation for audio bars */}
      <style>{`
        @keyframes ambient-bar {
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
      `}</style>
    </div>
  );
}
