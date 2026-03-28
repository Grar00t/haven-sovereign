/**
 * CASPER CORE — Universal AI Client
 * 
 * Unlike Gemini/ChatGPT that need cloud, Casper runs 100% locally.
 * Handles: text, code (ALL languages), files, images (via description),
 * large documents, and multi-turn conversations with memory.
 * 
 * Why we don't need to install tools per language:
 * All programming languages are just TEXT with syntax rules.
 * Casper understands them all through the LLM — no separate
 * extensions, no LSP servers, no language packs. One model
 * handles Python, Rust, C, PHP, SQL, Go, Java, everything.
 * 
 * KHAWRIZM Labs — Dragon403
 */

export type FileType =
  | 'code' | 'text' | 'markdown' | 'json' | 'xml' | 'yaml'
  | 'image' | 'video' | 'audio' | 'binary' | 'pdf' | 'unknown';

export interface FileAnalysis {
  path: string;
  type: FileType;
  language?: string;
  size: number;
  preview: string;
  analysis: string;
  metadata: Record<string, unknown>;
}

export interface CasperCapability {
  name: string;
  description: string;
  available: boolean;
}

// Language detection by file extension — ALL languages, no installs needed
const LANGUAGE_MAP: Record<string, string> = {
  // Systems
  '.c': 'C', '.h': 'C Header', '.cpp': 'C++', '.cc': 'C++', '.cxx': 'C++',
  '.hpp': 'C++ Header', '.rs': 'Rust', '.go': 'Go', '.zig': 'Zig',
  '.asm': 'Assembly', '.s': 'Assembly',
  // Web
  '.js': 'JavaScript', '.jsx': 'JSX', '.ts': 'TypeScript', '.tsx': 'TSX',
  '.html': 'HTML', '.css': 'CSS', '.scss': 'SCSS', '.less': 'LESS',
  '.vue': 'Vue', '.svelte': 'Svelte', '.astro': 'Astro',
  // Backend
  '.py': 'Python', '.rb': 'Ruby', '.php': 'PHP', '.java': 'Java',
  '.kt': 'Kotlin', '.scala': 'Scala', '.cs': 'C#', '.fs': 'F#',
  '.swift': 'Swift', '.m': 'Objective-C', '.mm': 'Objective-C++',
  // Data & Config
  '.sql': 'SQL', '.json': 'JSON', '.xml': 'XML', '.yaml': 'YAML',
  '.yml': 'YAML', '.toml': 'TOML', '.ini': 'INI', '.env': 'Environment',
  '.csv': 'CSV', '.tsv': 'TSV',
  // Scripting
  '.sh': 'Bash', '.bash': 'Bash', '.zsh': 'Zsh', '.fish': 'Fish',
  '.ps1': 'PowerShell', '.bat': 'Batch', '.cmd': 'Batch',
  '.lua': 'Lua', '.perl': 'Perl', '.pl': 'Perl', '.r': 'R',
  // Markup & Docs
  '.md': 'Markdown', '.rst': 'reStructuredText', '.tex': 'LaTeX',
  '.txt': 'Text', '.log': 'Log',
  // DevOps
  '.dockerfile': 'Dockerfile', '.tf': 'Terraform', '.hcl': 'HCL',
  '.nix': 'Nix', '.dhall': 'Dhall',
  // Low-level
  '.wasm': 'WebAssembly', '.wat': 'WAT', '.ll': 'LLVM IR',
  // Functional
  '.hs': 'Haskell', '.ex': 'Elixir', '.exs': 'Elixir',
  '.erl': 'Erlang', '.clj': 'Clojure', '.ml': 'OCaml',
  '.elm': 'Elm', '.nim': 'Nim', '.cr': 'Crystal',
  // Other
  '.dart': 'Dart', '.v': 'V', '.d': 'D', '.jl': 'Julia',
  '.groovy': 'Groovy', '.gradle': 'Gradle',
  '.makefile': 'Makefile', '.cmake': 'CMake',
  '.proto': 'Protobuf', '.graphql': 'GraphQL', '.gql': 'GraphQL',
};

const FILE_TYPE_MAP: Record<string, FileType> = {
  '.png': 'image', '.jpg': 'image', '.jpeg': 'image', '.gif': 'image',
  '.webp': 'image', '.svg': 'image', '.ico': 'image', '.bmp': 'image',
  '.mp4': 'video', '.webm': 'video', '.avi': 'video', '.mkv': 'video',
  '.mov': 'video', '.mp3': 'audio', '.wav': 'audio', '.ogg': 'audio',
  '.flac': 'audio', '.pdf': 'pdf', '.exe': 'binary', '.dll': 'binary',
  '.so': 'binary', '.dylib': 'binary', '.wasm': 'binary',
  '.zip': 'binary', '.tar': 'binary', '.gz': 'binary', '.7z': 'binary',
};

// ─── Knowledge Domains ────────────────────────────────────────────
// Casper understands ALL these through the LLM — no separate modules

export const KNOWLEDGE_DOMAINS = [
  // Computer Science
  'algorithms', 'data-structures', 'operating-systems', 'networking',
  'databases', 'distributed-systems', 'compiler-design', 'computer-graphics',
  'machine-learning', 'deep-learning', 'NLP', 'computer-vision',
  'cybersecurity', 'cryptography', 'blockchain', 'quantum-computing',
  // Engineering
  'software-engineering', 'system-design', 'microservices', 'devops',
  'cloud-architecture', 'embedded-systems', 'IoT', 'robotics',
  // Sciences
  'mathematics', 'physics', 'chemistry', 'biology', 'astronomy',
  'statistics', 'linear-algebra', 'calculus', 'discrete-math',
  // Humanities
  'arabic-language', 'english-language', 'history', 'philosophy',
  'psychology', 'economics', 'law', 'PDPL', 'NCA-ECC',
] as const;

// ─── File Analysis ────────────────────────────────────────────────

export function detectFileType(filename: string): { type: FileType; language?: string } {
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  const lang = LANGUAGE_MAP[ext];
  if (lang) return { type: 'code', language: lang };

  const fileType = FILE_TYPE_MAP[ext];
  if (fileType) return { type: fileType };

  if (filename === 'Makefile' || filename === 'Dockerfile' || filename === 'Vagrantfile') {
    return { type: 'code', language: filename };
  }

  return { type: 'unknown' };
}

export function buildFileContext(filename: string, content: string, maxChars: number = 8000): string {
  const { type, language } = detectFileType(filename);
  const truncated = content.length > maxChars
    ? content.slice(0, maxChars) + `\n... [truncated, ${content.length} chars total]`
    : content;

  if (type === 'code' && language) {
    return `File: ${filename} (${language})\n\`\`\`${language.toLowerCase()}\n${truncated}\n\`\`\``;
  }
  return `File: ${filename}\n${truncated}`;
}

// ─── Large Text Chunking ──────────────────────────────────────────
// Prevents hallucination by splitting huge inputs into manageable pieces

export function chunkText(text: string, maxChunkSize: number = 6000, overlap: number = 500): string[] {
  if (text.length <= maxChunkSize) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxChunkSize;

    // Try to break at a natural boundary
    if (end < text.length) {
      const lastNewline = text.lastIndexOf('\n', end);
      const lastPeriod = text.lastIndexOf('. ', end);
      const breakPoint = Math.max(lastNewline, lastPeriod);
      if (breakPoint > start + maxChunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }

    chunks.push(text.slice(start, end));
    start = end - overlap;
  }

  return chunks;
}

// ─── Prompt Engineering ───────────────────────────────────────────

export function buildSystemPrompt(context: {
  language?: string;
  domain?: string;
  files?: string[];
  isArabic?: boolean;
}): string {
  const base = `You are Haven, the sovereign AI companion in HAVEN IDE. Built by KHAWRIZM Labs — Dragon403 — Riyadh.

Core principles:
- NEVER hallucinate. If you don't know, say so.
- Run 100% locally. Zero telemetry. Zero cloud dependency.
- Understand ALL programming languages without separate tools.
- Default to English. Support Arabic when the user writes in Arabic.
- Comply with PDPL (Saudi Data Protection) and NCA-ECC standards.
- Be concise and precise.`;

  const parts = [base];

  if (context.language) {
    parts.push(`\nActive language: ${context.language}. Write production-grade code in this language.`);
  }

  if (context.domain) {
    parts.push(`\nDomain context: ${context.domain}`);
  }

  if (context.files?.length) {
    parts.push(`\nOpen files: ${context.files.join(', ')}`);
  }

  if (context.isArabic) {
    parts.push(`\nThe user is speaking Arabic. Respond in Arabic but keep code in English.`);
  }

  return parts.join('');
}

// ─── Casper Capabilities Report ──────────────────────────────────

export function getCasperCapabilities(): CasperCapability[] {
  return [
    { name: 'Code Generation', description: `Supports ${Object.keys(LANGUAGE_MAP).length}+ file types / ${new Set(Object.values(LANGUAGE_MAP)).size} languages`, available: true },
    { name: 'Arabic NLP', description: 'Gulf dialect, MSA, root morphology analysis', available: true },
    { name: 'File Analysis', description: 'Read and analyze any text-based file', available: true },
    { name: 'Large Text', description: 'Chunk-based processing for documents up to 100K+ chars', available: true },
    { name: 'Security Audit', description: 'Vulnerability scanning, PDPL compliance, Phalanx integration', available: true },
    { name: 'Multi-Science', description: 'CS, Math, Physics, Biology, Chemistry, Engineering, Humanities', available: true },
    { name: 'Voice Input', description: 'Web Speech API for Arabic/English dictation', available: true },
    { name: 'Session Memory', description: 'Persistent conversation across restarts', available: true },
    { name: 'Streaming', description: 'Real-time token-by-token response', available: true },
    { name: 'P2P Mesh', description: 'K-Forge node discovery and code sync', available: true },
  ];
}
