/**
 * CASPER — The Ghost AI Assistant
 * كاسبر — الشبح الذكي
 * 
 * A floating AI assistant inspired by Casper the Friendly Ghost.
 * It moves freely, serves the user with voice/text/code assistance,
 * and integrates with Niyah Engine's Three-Lobe architecture.
 * 
 * KHAWRIZM Labs — Dragon403
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useIDEStore } from '../useIDEStore';
import {
  Ghost, Send, Mic, MicOff, Minimize2, Maximize2,
  Brain, Sparkles, Shield, Code2, X, GripVertical,
  Volume2, VolumeX, Loader2,
} from 'lucide-react';

interface CasperMessage {
  id: string;
  role: 'user' | 'casper' | 'system';
  content: string;
  lobe?: 'sensory' | 'cognitive' | 'executive';
  timestamp: number;
  model?: string;
}

interface CasperPosition {
  x: number;
  y: number;
}

const CASPER_PERSONALITY = {
  greeting_ar: 'مرحباً! أنا كاسبر، الشبح الودود. كيف أقدر أساعدك اليوم؟',
  greeting_en: "Hey! I'm Casper, your friendly ghost assistant. How can I help?",
  thinking_ar: 'أفكر...',
  thinking_en: 'Thinking...',
};

const LOBE_COLORS = {
  sensory: '#34d399',
  cognitive: '#60a5fa',
  executive: '#f59e0b',
};

export function CasperAssistant() {
  const { currentTheme } = useIDEStore();
  const [messages, setMessages] = useState<CasperMessage[]>([
    {
      id: 'welcome',
      role: 'casper',
      content: CASPER_PERSONALITY.greeting_ar + '\n\n' + CASPER_PERSONALITY.greeting_en,
      lobe: 'sensory',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState<CasperPosition>({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const [listeningVoice, setListeningVoice] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ollamaStatus, setOllamaStatus] = useState<'online' | 'offline'>('offline');

  const chatRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);

  // Initialize position
  useEffect(() => {
    if (position.x === -1) {
      setPosition({
        x: window.innerWidth - 380,
        y: window.innerHeight - 520,
      });
    }
  }, []);

  // Check Ollama status
  useEffect(() => {
    const check = async () => {
      try {
        if (typeof window !== 'undefined' && 'haven' in window) {
          const h = await (window as any).haven.ollama.health();
          setOllamaStatus(h.status === 'online' ? 'online' : 'offline');
        } else {
          const res = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(3000) });
          setOllamaStatus(res.ok ? 'online' : 'offline');
        }
      } catch {
        setOllamaStatus('offline');
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  }, [position]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 360, dragRef.current.posX + dx)),
          y: Math.max(0, Math.min(window.innerHeight - 100, dragRef.current.posY + dy)),
        });
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Detect language and route to lobe
  const detectLobe = (text: string): 'sensory' | 'cognitive' | 'executive' => {
    const arCount = [...text].filter(c => c.charCodeAt(0) >= 0x0600 && c.charCodeAt(0) <= 0x06FF).length;
    const isArabic = arCount / Math.max(text.length, 1) > 0.15;

    const lower = text.toLowerCase();
    if (/analyze|explain|why|how|review|debug|حلل|اشرح|لماذا|كيف/.test(lower)) return 'cognitive';
    if (/write|create|build|fix|code|deploy|اكتب|سوي|ابني|صلح/.test(lower)) return 'executive';
    if (isArabic) return 'sensory';
    return 'executive';
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: CasperMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const lobe = detectLobe(userMsg.content);

    try {
      let responseText = '';
      let model = 'niyah:v4';

      // Try Electron bridge first, then direct fetch
      if (typeof window !== 'undefined' && 'haven' in window) {
        const result = await (window as any).haven.ollama.generate(
          model,
          `User: ${userMsg.content}\nCasper:`,
          `You are Casper (كاسبر), the friendly ghost AI assistant in HAVEN IDE. You are helpful, precise, and a bit playful. Built by KHAWRIZM Labs. Respond in the same language the user uses. For code, always provide complete examples.`
        );
        responseText = result?.response || result?.error || 'Ollama is not responding';
        model = result?.model || model;
      } else {
        try {
          const res = await fetch('http://127.0.0.1:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'niyah:v4',
              prompt: `User: ${userMsg.content}\nCasper:`,
              system: 'You are Casper, the friendly ghost AI in HAVEN IDE. Be helpful and precise.',
              stream: false,
              options: { temperature: 0.3, num_predict: 4096 },
            }),
            signal: AbortSignal.timeout(60000),
          });
          const data = await res.json();
          responseText = data.response || 'No response';
          model = data.model || model;
        } catch {
          responseText = ollamaStatus === 'offline'
            ? 'Ollama is offline. Start it with: ollama serve'
            : 'Connection error. Check if Ollama is running.';
        }
      }

      const casperMsg: CasperMessage = {
        id: `casper-${Date.now()}`,
        role: 'casper',
        content: responseText.trim(),
        lobe,
        timestamp: Date.now(),
        model,
      };

      setMessages(prev => [...prev, casperMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `Error: ${err}`,
        timestamp: Date.now(),
      }]);
    }

    setIsLoading(false);
  };

  // Voice input (Web Speech API)
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;

    if (listeningVoice) {
      setListeningVoice(false);
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + ' ' + transcript);
      setListeningVoice(false);
    };

    recognition.onerror = () => setListeningVoice(false);
    recognition.onend = () => setListeningVoice(false);

    recognition.start();
    setListeningVoice(true);
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed z-[999] group"
        style={{
          right: 24,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${currentTheme.accent}40, ${currentTheme.accent}20)`,
          border: `2px solid ${currentTheme.accent}50`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: `0 4px 20px ${currentTheme.accent}30`,
        }}
        title="Casper — الشبح الذكي"
      >
        <Ghost size={28} style={{ color: currentTheme.accent }} className="group-hover:scale-110 transition-transform" />
        {ollamaStatus === 'online' && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 animate-pulse" />
        )}
      </button>
    );
  }

  return (
    <div
      className="fixed z-[998] flex flex-col overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: isExpanded ? 480 : 360,
        height: isExpanded ? 600 : 460,
        borderRadius: 16,
        background: currentTheme.bg + 'f8',
        border: `1px solid ${currentTheme.border}`,
        backdropFilter: 'blur(20px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 60px ${currentTheme.accent}10`,
        transition: isDragging ? 'none' : 'width 0.3s, height 0.3s',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-move select-none"
        style={{ borderBottom: `1px solid ${currentTheme.border}`, background: currentTheme.sidebar }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Ghost size={18} style={{ color: currentTheme.accent }} />
          <span className="font-semibold text-sm" style={{ color: currentTheme.text }}>
            Casper
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full"
            style={{
              background: ollamaStatus === 'online' ? '#10b98120' : '#ef444420',
              color: ollamaStatus === 'online' ? '#10b981' : '#ef4444',
            }}>
            {ollamaStatus}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-1 rounded hover:bg-white/10">
            {soundEnabled ? <Volume2 size={14} style={{ color: currentTheme.textMuted }} /> :
              <VolumeX size={14} style={{ color: currentTheme.textMuted }} />}
          </button>
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 rounded hover:bg-white/10">
            {isExpanded ? <Minimize2 size={14} style={{ color: currentTheme.textMuted }} /> :
              <Maximize2 size={14} style={{ color: currentTheme.textMuted }} />}
          </button>
          <button onClick={() => setIsMinimized(true)} className="p-1 rounded hover:bg-white/10">
            <X size={14} style={{ color: currentTheme.textMuted }} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-3"
        style={{ scrollbarWidth: 'thin', scrollbarColor: `${currentTheme.border} transparent` }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed"
              style={{
                background: msg.role === 'user'
                  ? currentTheme.accent + '25'
                  : msg.role === 'system'
                    ? '#ef444420'
                    : currentTheme.sidebar,
                color: currentTheme.text,
                borderBottomRightRadius: msg.role === 'user' ? 4 : undefined,
                borderBottomLeftRadius: msg.role !== 'user' ? 4 : undefined,
              }}
            >
              {msg.lobe && (
                <div className="flex items-center gap-1 mb-1">
                  {msg.lobe === 'cognitive' && <Brain size={11} />}
                  {msg.lobe === 'executive' && <Code2 size={11} />}
                  {msg.lobe === 'sensory' && <Sparkles size={11} />}
                  <span className="text-[9px] uppercase tracking-wider"
                    style={{ color: LOBE_COLORS[msg.lobe] }}>
                    {msg.lobe}
                  </span>
                  {msg.model && (
                    <span className="text-[9px] ml-1" style={{ color: currentTheme.textMuted }}>
                      ({msg.model})
                    </span>
                  )}
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-xl px-3 py-2 text-[13px]"
              style={{ background: currentTheme.sidebar, color: currentTheme.textMuted }}>
              <Loader2 size={14} className="animate-spin inline mr-2" />
              {CASPER_PERSONALITY.thinking_ar}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2" style={{ borderTop: `1px solid ${currentTheme.border}` }}>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVoice}
            className="p-2 rounded-lg transition-colors"
            style={{
              background: listeningVoice ? '#ef444440' : 'transparent',
              color: listeningVoice ? '#ef4444' : currentTheme.textMuted,
            }}
          >
            {listeningVoice ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="اسأل كاسبر أي شي..."
            className="flex-1 bg-transparent outline-none text-[13px]"
            style={{ color: currentTheme.text }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg transition-all"
            style={{
              background: input.trim() ? currentTheme.accent + '30' : 'transparent',
              color: input.trim() ? currentTheme.accent : currentTheme.textMuted,
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CasperAssistant;
