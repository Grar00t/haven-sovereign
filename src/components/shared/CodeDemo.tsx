import { useState, useEffect, useRef, type FC } from 'react';
import { motion } from 'motion/react';

interface Token {
  text: string;
  color: string;
}

interface CodeLine {
  tokens: Token[];
  indent: number;
}

const COLORS = {
  keyword: '#c678dd',
  string: '#98c379',
  function: '#61afef',
  variable: '#e06c75',
  comment: '#5c6370',
  type: '#e5c07b',
  operator: '#56b6c2',
  plain: '#abb2bf',
  number: '#d19a66',
  green: '#00ff41',
};

const codeSnippet: CodeLine[] = [
  { indent: 0, tokens: [
    { text: '// ', color: COLORS.comment },
    { text: 'HAVEN Sovereign AI — Zero Telemetry', color: COLORS.comment },
  ]},
  { indent: 0, tokens: [
    { text: 'import', color: COLORS.keyword },
    { text: ' { Haven, SovereignEngine }', color: COLORS.variable },
    { text: ' from', color: COLORS.keyword },
    { text: " '@haven/core'", color: COLORS.string },
  ]},
  { indent: 0, tokens: [] },
  { indent: 0, tokens: [
    { text: 'const', color: COLORS.keyword },
    { text: ' engine', color: COLORS.variable },
    { text: ' = ', color: COLORS.operator },
    { text: 'new', color: COLORS.keyword },
    { text: ' SovereignEngine', color: COLORS.type },
    { text: '({', color: COLORS.plain },
  ]},
  { indent: 1, tokens: [
    { text: 'mode', color: COLORS.variable },
    { text: ': ', color: COLORS.plain },
    { text: "'local'", color: COLORS.string },
    { text: ',', color: COLORS.plain },
  ]},
  { indent: 1, tokens: [
    { text: 'telemetry', color: COLORS.variable },
    { text: ': ', color: COLORS.plain },
    { text: 'false', color: COLORS.number },
    { text: ',', color: COLORS.plain },
  ]},
  { indent: 1, tokens: [
    { text: 'encryption', color: COLORS.variable },
    { text: ': ', color: COLORS.plain },
    { text: "'AES-256-GCM'", color: COLORS.string },
    { text: ',', color: COLORS.plain },
  ]},
  { indent: 1, tokens: [
    { text: 'niyahLogic', color: COLORS.variable },
    { text: ': ', color: COLORS.plain },
    { text: 'true', color: COLORS.number },
    { text: ',', color: COLORS.plain },
  ]},
  { indent: 0, tokens: [
    { text: '})', color: COLORS.plain },
  ]},
  { indent: 0, tokens: [] },
  { indent: 0, tokens: [
    { text: 'const', color: COLORS.keyword },
    { text: ' response', color: COLORS.variable },
    { text: ' = ', color: COLORS.operator },
    { text: 'await', color: COLORS.keyword },
    { text: ' engine', color: COLORS.variable },
    { text: '.', color: COLORS.plain },
    { text: 'query', color: COLORS.function },
    { text: '({', color: COLORS.plain },
  ]},
  { indent: 1, tokens: [
    { text: 'intent', color: COLORS.variable },
    { text: ': ', color: COLORS.plain },
    { text: "'analyze'", color: COLORS.string },
    { text: ',', color: COLORS.plain },
  ]},
  { indent: 1, tokens: [
    { text: 'context', color: COLORS.variable },
    { text: ': ', color: COLORS.plain },
    { text: 'screen', color: COLORS.variable },
    { text: '.', color: COLORS.plain },
    { text: 'capture', color: COLORS.function },
    { text: '()', color: COLORS.plain },
    { text: ',', color: COLORS.plain },
  ]},
  { indent: 1, tokens: [
    { text: 'memory', color: COLORS.variable },
    { text: ': ', color: COLORS.plain },
    { text: "'persistent'", color: COLORS.string },
    { text: ',  ', color: COLORS.plain },
    { text: '// ∞ context retention', color: COLORS.comment },
  ]},
  { indent: 0, tokens: [
    { text: '})', color: COLORS.plain },
  ]},
  { indent: 0, tokens: [] },
  { indent: 0, tokens: [
    { text: 'console', color: COLORS.variable },
    { text: '.', color: COLORS.plain },
    { text: 'log', color: COLORS.function },
    { text: '(response.', color: COLORS.plain },
    { text: 'sovereign', color: COLORS.variable },
    { text: ')  ', color: COLORS.plain },
    { text: '// → true', color: COLORS.comment },
  ]},
  { indent: 0, tokens: [
    { text: 'console', color: COLORS.variable },
    { text: '.', color: COLORS.plain },
    { text: 'log', color: COLORS.function },
    { text: '(response.', color: COLORS.plain },
    { text: 'dataLeaked', color: COLORS.variable },
    { text: ') ', color: COLORS.plain },
    { text: '// → 0 bytes', color: COLORS.comment },
  ]},
];

export const CodeDemo: FC<{ className?: string }> = ({ className = '' }) => {
  const [visibleLines, setVisibleLines] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isTyping) {
          setIsTyping(true);
        }
      },
      { threshold: 0.3 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isTyping]);

  useEffect(() => {
    if (!isTyping) return;

    const totalLines = codeSnippet.length;
    if (visibleLines >= totalLines) return;

    const currentLine = codeSnippet[visibleLines];
    const totalCharsInLine = currentLine.tokens.reduce((acc, t) => acc + t.text.length, 0);

    if (currentChar >= totalCharsInLine) {
      const timeout = setTimeout(() => {
        setVisibleLines(v => v + 1);
        setCurrentChar(0);
      }, currentLine.tokens.length === 0 ? 100 : 50);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setCurrentChar(c => c + 1);
    }, 18 + Math.random() * 22);
    return () => clearTimeout(timeout);
  }, [isTyping, visibleLines, currentChar]);

  const renderLine = (line: CodeLine, lineIndex: number, isCurrentLine: boolean) => {
    const indent = '  '.repeat(line.indent);
    let charCount = 0;

    return (
      <div key={lineIndex} className="leading-6 h-6">
        <span className="text-white/20 select-none inline-block w-8 text-right mr-4 text-[11px]">
          {lineIndex + 1}
        </span>
        <span style={{ whiteSpace: 'pre' }}>{indent}</span>
        {line.tokens.map((token, ti) => {
          const startChar = charCount;
          charCount += token.text.length;

          if (!isCurrentLine) {
            return <span key={ti} style={{ color: token.color }}>{token.text}</span>;
          }

          const visibleLength = Math.max(0, Math.min(token.text.length, currentChar - startChar));
          const visibleText = token.text.substring(0, visibleLength);

          return <span key={ti} style={{ color: token.color }}>{visibleText}</span>;
        })}
        {isCurrentLine && visibleLines < codeSnippet.length && (
          <span className="inline-block w-[7px] h-[15px] bg-neon-green/80 ml-px animate-pulse align-middle" />
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-2xl border border-white/10 bg-[#1e1e2e] overflow-hidden shadow-2xl shadow-black/50"
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.03] border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-[10px] font-mono text-white/30 ml-2">sovereign.ts — HAVEN IDE</span>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
            <span className="text-[8px] font-mono text-neon-green/60 uppercase tracking-wider">local only</span>
          </div>
        </div>

        {/* Code area */}
        <div className="p-4 font-mono text-[13px] overflow-hidden min-h-[360px]">
          {codeSnippet.map((line, i) => {
            if (i > visibleLines) return null;
            return renderLine(line, i, i === visibleLines);
          })}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-neon-green/5 border-t border-white/5 text-[9px] font-mono text-white/30">
          <div className="flex items-center gap-3">
            <span>TypeScript</span>
            <span>UTF-8</span>
            <span>LF</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-neon-green/60">⚡ Sovereign Engine Active</span>
            <span>Ln {Math.min(visibleLines + 1, codeSnippet.length)}, Col {currentChar}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
