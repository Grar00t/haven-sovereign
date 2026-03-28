/**
 * HAVEN Universal Language Runtime
 * 
 * The dirty secret of VS Code: you don't NEED separate extensions
 * per language. All programming languages are TEXT with syntax rules.
 * The LLM understands them ALL. What you need is:
 * 
 *   1. Syntax highlighting (regex-based, covers 60+ languages)
 *   2. Smart completion (LLM-powered, language-agnostic)
 *   3. Error detection (LLM-powered, no LSP server needed)
 *   4. Code execution (spawn the interpreter/compiler directly)
 * 
 * Microsoft makes you install extensions because that's their
 * marketplace business model. We don't play that game.
 * 
 * KHAWRIZM Labs — Dragon403
 */

// ─── Language Registry ────────────────────────────────────────────
// Every language the IDE understands natively, with execution info

export interface LanguageSpec {
  id: string;
  name: string;
  extensions: string[];
  lineComment: string;
  blockComment?: [string, string];
  stringDelimiters: string[];
  keywords: string[];
  builtinTypes?: string[];
  executeCmd?: string;          // How to run a file
  compileCmd?: string;          // How to compile (if compiled)
  repl?: string;                // Interactive REPL command
  packageManager?: string;
  family: 'systems' | 'web' | 'scripting' | 'functional' | 'data' | 'markup' | 'shell';
}

export const LANGUAGES: LanguageSpec[] = [
  // ── Systems Languages ──
  {
    id: 'c', name: 'C', extensions: ['.c', '.h'],
    lineComment: '//', blockComment: ['/*', '*/'],
    stringDelimiters: ['"', "'"],
    keywords: ['auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
      'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'inline',
      'int', 'long', 'register', 'restrict', 'return', 'short', 'signed', 'sizeof',
      'static', 'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while'],
    builtinTypes: ['int', 'char', 'float', 'double', 'void', 'long', 'short', 'unsigned', 'size_t'],
    compileCmd: 'gcc -O2 -Wall -o {out} {file}',
    executeCmd: './{out}',
    family: 'systems',
  },
  {
    id: 'cpp', name: 'C++', extensions: ['.cpp', '.cc', '.cxx', '.hpp'],
    lineComment: '//', blockComment: ['/*', '*/'],
    stringDelimiters: ['"', "'"],
    keywords: ['alignas', 'alignof', 'and', 'asm', 'auto', 'bool', 'break', 'case',
      'catch', 'char', 'class', 'concept', 'const', 'constexpr', 'continue', 'co_await',
      'co_return', 'co_yield', 'decltype', 'default', 'delete', 'do', 'double', 'else',
      'enum', 'explicit', 'export', 'extern', 'false', 'float', 'for', 'friend', 'goto',
      'if', 'inline', 'int', 'long', 'mutable', 'namespace', 'new', 'noexcept', 'nullptr',
      'operator', 'or', 'private', 'protected', 'public', 'register', 'return', 'short',
      'signed', 'sizeof', 'static', 'struct', 'switch', 'template', 'this', 'throw',
      'true', 'try', 'typedef', 'typename', 'union', 'unsigned', 'using', 'virtual',
      'void', 'volatile', 'while'],
    compileCmd: 'g++ -std=c++20 -O2 -Wall -o {out} {file}',
    executeCmd: './{out}',
    family: 'systems',
  },
  {
    id: 'rust', name: 'Rust', extensions: ['.rs'],
    lineComment: '//', blockComment: ['/*', '*/'],
    stringDelimiters: ['"'],
    keywords: ['as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn',
      'else', 'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let',
      'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self',
      'static', 'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while'],
    builtinTypes: ['i8', 'i16', 'i32', 'i64', 'i128', 'u8', 'u16', 'u32', 'u64', 'u128',
      'f32', 'f64', 'bool', 'char', 'str', 'String', 'Vec', 'Option', 'Result'],
    compileCmd: 'rustc -O -o {out} {file}',
    executeCmd: './{out}',
    repl: 'evcxr',
    packageManager: 'cargo',
    family: 'systems',
  },
  {
    id: 'go', name: 'Go', extensions: ['.go'],
    lineComment: '//', blockComment: ['/*', '*/'],
    stringDelimiters: ['"', '`'],
    keywords: ['break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else',
      'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface', 'map',
      'package', 'range', 'return', 'select', 'struct', 'switch', 'type', 'var'],
    executeCmd: 'go run {file}',
    compileCmd: 'go build -o {out} {file}',
    packageManager: 'go mod',
    family: 'systems',
  },
  {
    id: 'zig', name: 'Zig', extensions: ['.zig'],
    lineComment: '//',
    stringDelimiters: ['"'],
    keywords: ['align', 'allowzero', 'and', 'anyframe', 'anytype', 'asm', 'async',
      'await', 'break', 'catch', 'comptime', 'const', 'continue', 'defer', 'else',
      'enum', 'error', 'export', 'extern', 'fn', 'for', 'if', 'inline', 'noalias',
      'nosuspend', 'null', 'or', 'orelse', 'packed', 'pub', 'resume', 'return',
      'struct', 'suspend', 'switch', 'test', 'try', 'undefined', 'union', 'unreachable',
      'var', 'volatile', 'while'],
    compileCmd: 'zig build-exe {file}',
    family: 'systems',
  },

  // ── Web Languages ──
  {
    id: 'javascript', name: 'JavaScript', extensions: ['.js', '.mjs', '.cjs'],
    lineComment: '//', blockComment: ['/*', '*/'],
    stringDelimiters: ['"', "'", '`'],
    keywords: ['async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
      'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'false',
      'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new',
      'null', 'of', 'return', 'static', 'super', 'switch', 'this', 'throw', 'true',
      'try', 'typeof', 'undefined', 'var', 'void', 'while', 'with', 'yield'],
    executeCmd: 'node {file}',
    repl: 'node',
    packageManager: 'npm',
    family: 'web',
  },
  {
    id: 'typescript', name: 'TypeScript', extensions: ['.ts', '.tsx'],
    lineComment: '//', blockComment: ['/*', '*/'],
    stringDelimiters: ['"', "'", '`'],
    keywords: ['abstract', 'any', 'as', 'asserts', 'async', 'await', 'bigint', 'boolean',
      'break', 'case', 'catch', 'class', 'const', 'continue', 'declare', 'default',
      'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for',
      'from', 'function', 'get', 'if', 'implements', 'import', 'in', 'infer', 'instanceof',
      'interface', 'is', 'keyof', 'let', 'module', 'namespace', 'never', 'new', 'null',
      'number', 'object', 'of', 'override', 'package', 'private', 'protected', 'public',
      'readonly', 'return', 'satisfies', 'set', 'static', 'string', 'super', 'switch',
      'symbol', 'this', 'throw', 'true', 'try', 'type', 'typeof', 'undefined', 'unique',
      'unknown', 'var', 'void', 'while', 'with', 'yield'],
    executeCmd: 'npx tsx {file}',
    repl: 'npx tsx',
    packageManager: 'npm',
    family: 'web',
  },
  {
    id: 'html', name: 'HTML', extensions: ['.html', '.htm'],
    lineComment: '', blockComment: ['<!--', '-->'],
    stringDelimiters: ['"', "'"],
    keywords: ['html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'script', 'style',
      'link', 'meta', 'title', 'form', 'input', 'button', 'table', 'tr', 'td', 'ul', 'li'],
    family: 'markup',
  },
  {
    id: 'css', name: 'CSS', extensions: ['.css'],
    lineComment: '', blockComment: ['/*', '*/'],
    stringDelimiters: ['"', "'"],
    keywords: ['@import', '@media', '@keyframes', '@font-face', '@supports',
      'var', 'calc', 'min', 'max', 'clamp'],
    family: 'markup',
  },

  // ── Scripting Languages ──
  {
    id: 'python', name: 'Python', extensions: ['.py', '.pyw'],
    lineComment: '#',
    stringDelimiters: ['"', "'", '"""', "'''"],
    keywords: ['False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
      'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
      'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda',
      'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'],
    builtinTypes: ['int', 'float', 'str', 'bool', 'list', 'dict', 'tuple', 'set', 'bytes', 'None'],
    executeCmd: 'python3 {file}',
    repl: 'python3',
    packageManager: 'pip',
    family: 'scripting',
  },
  {
    id: 'ruby', name: 'Ruby', extensions: ['.rb'],
    lineComment: '#', blockComment: ['=begin', '=end'],
    stringDelimiters: ['"', "'"],
    keywords: ['BEGIN', 'END', 'alias', 'and', 'begin', 'break', 'case', 'class',
      'def', 'defined?', 'do', 'else', 'elsif', 'end', 'ensure', 'false', 'for',
      'if', 'in', 'module', 'next', 'nil', 'not', 'or', 'redo', 'rescue', 'retry',
      'return', 'self', 'super', 'then', 'true', 'undef', 'unless', 'until', 'when',
      'while', 'yield'],
    executeCmd: 'ruby {file}',
    repl: 'irb',
    packageManager: 'gem',
    family: 'scripting',
  },
  {
    id: 'php', name: 'PHP', extensions: ['.php'],
    lineComment: '//', blockComment: ['/*', '*/'],
    stringDelimiters: ['"', "'"],
    keywords: ['abstract', 'and', 'array', 'as', 'break', 'callable', 'case', 'catch',
      'class', 'clone', 'const', 'continue', 'declare', 'default', 'die', 'do', 'echo',
      'else', 'elseif', 'empty', 'enddeclare', 'endfor', 'endforeach', 'endif',
      'endswitch', 'endwhile', 'eval', 'exit', 'extends', 'false', 'final', 'finally',
      'fn', 'for', 'foreach', 'function', 'global', 'goto', 'if', 'implements',
      'include', 'instanceof', 'interface', 'isset', 'list', 'match', 'namespace',
      'new', 'null', 'or', 'print', 'private', 'protected', 'public', 'require',
      'return', 'static', 'switch', 'this', 'throw', 'trait', 'true', 'try',
      'unset', 'use', 'var', 'while', 'xor', 'yield'],
    executeCmd: 'php {file}',
    repl: 'php -a',
    packageManager: 'composer',
    family: 'scripting',
  },
  {
    id: 'perl', name: 'Perl', extensions: ['.pl', '.pm'],
    lineComment: '#',
    stringDelimiters: ['"', "'"],
    keywords: ['my', 'our', 'local', 'sub', 'if', 'else', 'elsif', 'unless', 'while',
      'until', 'for', 'foreach', 'do', 'last', 'next', 'redo', 'return', 'die',
      'use', 'require', 'package', 'BEGIN', 'END'],
    executeCmd: 'perl {file}',
    repl: 'perl -de 0',
    family: 'scripting',
  },
  {
    id: 'lua', name: 'Lua', extensions: ['.lua'],
    lineComment: '--', blockComment: ['--[[', ']]'],
    stringDelimiters: ['"', "'"],
    keywords: ['and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for',
      'function', 'goto', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat',
      'return', 'then', 'true', 'until', 'while'],
    executeCmd: 'lua {file}',
    repl: 'lua',
    family: 'scripting',
  },

  // ── Data Languages ──
  {
    id: 'sql', name: 'SQL', extensions: ['.sql'],
    lineComment: '--', blockComment: ['/*', '*/'],
    stringDelimiters: ["'"],
    keywords: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE',
      'DROP', 'ALTER', 'TABLE', 'INDEX', 'VIEW', 'JOIN', 'INNER', 'LEFT', 'RIGHT',
      'OUTER', 'ON', 'AND', 'OR', 'NOT', 'NULL', 'IN', 'BETWEEN', 'LIKE', 'ORDER',
      'BY', 'GROUP', 'HAVING', 'UNION', 'ALL', 'DISTINCT', 'AS', 'INTO', 'VALUES',
      'SET', 'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION', 'GRANT', 'REVOKE'],
    family: 'data',
  },
  {
    id: 'r', name: 'R', extensions: ['.r', '.R'],
    lineComment: '#',
    stringDelimiters: ['"', "'"],
    keywords: ['if', 'else', 'repeat', 'while', 'function', 'for', 'in', 'next',
      'break', 'TRUE', 'FALSE', 'NULL', 'Inf', 'NaN', 'NA', 'library', 'require'],
    executeCmd: 'Rscript {file}',
    repl: 'R',
    family: 'data',
  },

  // ── Functional Languages ──
  {
    id: 'haskell', name: 'Haskell', extensions: ['.hs'],
    lineComment: '--', blockComment: ['{-', '-}'],
    stringDelimiters: ['"'],
    keywords: ['case', 'class', 'data', 'default', 'deriving', 'do', 'else', 'forall',
      'foreign', 'if', 'import', 'in', 'infix', 'infixl', 'infixr', 'instance',
      'let', 'module', 'newtype', 'of', 'qualified', 'then', 'type', 'where'],
    compileCmd: 'ghc -O2 -o {out} {file}',
    executeCmd: 'runghc {file}',
    repl: 'ghci',
    family: 'functional',
  },
  {
    id: 'elixir', name: 'Elixir', extensions: ['.ex', '.exs'],
    lineComment: '#',
    stringDelimiters: ['"', "'"],
    keywords: ['after', 'and', 'case', 'catch', 'cond', 'def', 'defcallback',
      'defdelegate', 'defexception', 'defimpl', 'defmacro', 'defmodule', 'defoverridable',
      'defp', 'defprotocol', 'defstruct', 'do', 'else', 'end', 'false', 'fn', 'for',
      'if', 'import', 'in', 'nil', 'not', 'or', 'raise', 'receive', 'require',
      'rescue', 'true', 'try', 'unless', 'use', 'when', 'with'],
    executeCmd: 'elixir {file}',
    repl: 'iex',
    packageManager: 'mix',
    family: 'functional',
  },

  // ── Shell Languages ──
  {
    id: 'bash', name: 'Bash', extensions: ['.sh', '.bash'],
    lineComment: '#',
    stringDelimiters: ['"', "'"],
    keywords: ['if', 'then', 'else', 'elif', 'fi', 'case', 'esac', 'for', 'while',
      'until', 'do', 'done', 'in', 'function', 'select', 'time', 'coproc',
      'local', 'return', 'exit', 'export', 'readonly', 'declare', 'typeset',
      'source', 'alias', 'unalias'],
    executeCmd: 'bash {file}',
    repl: 'bash',
    family: 'shell',
  },
  {
    id: 'powershell', name: 'PowerShell', extensions: ['.ps1', '.psm1'],
    lineComment: '#', blockComment: ['<#', '#>'],
    stringDelimiters: ['"', "'"],
    keywords: ['Begin', 'Break', 'Catch', 'Class', 'Continue', 'Data', 'Define', 'Do',
      'DynamicParam', 'Else', 'ElseIf', 'End', 'Enum', 'Exit', 'Filter', 'Finally',
      'For', 'ForEach', 'From', 'Function', 'If', 'In', 'InlineScript', 'Parallel',
      'Param', 'Process', 'Return', 'Sequence', 'Switch', 'Throw', 'Trap', 'Try',
      'Until', 'Using', 'Var', 'While', 'Workflow'],
    executeCmd: 'pwsh {file}',
    repl: 'pwsh',
    family: 'shell',
  },

  // ── JVM Languages ──
  {
    id: 'java', name: 'Java', extensions: ['.java'],
    lineComment: '//', blockComment: ['/*', '*/'],
    stringDelimiters: ['"', "'"],
    keywords: ['abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
      'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends',
      'final', 'finally', 'float', 'for', 'goto', 'if', 'implements', 'import',
      'instanceof', 'int', 'interface', 'long', 'native', 'new', 'null', 'package',
      'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp',
      'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient',
      'true', 'false', 'try', 'var', 'void', 'volatile', 'while', 'yield', 'record', 'sealed'],
    compileCmd: 'javac {file}',
    executeCmd: 'java {classname}',
    packageManager: 'maven',
    family: 'web',
  },
  {
    id: 'kotlin', name: 'Kotlin', extensions: ['.kt', '.kts'],
    lineComment: '//', blockComment: ['/*', '*/'],
    stringDelimiters: ['"', "'"],
    keywords: ['abstract', 'actual', 'annotation', 'as', 'break', 'by', 'catch', 'class',
      'companion', 'const', 'constructor', 'continue', 'crossinline', 'data', 'delegate',
      'do', 'dynamic', 'else', 'enum', 'expect', 'external', 'false', 'field', 'file',
      'final', 'finally', 'for', 'fun', 'get', 'if', 'import', 'in', 'infix', 'init',
      'inline', 'inner', 'interface', 'internal', 'is', 'it', 'lateinit', 'noinline',
      'null', 'object', 'open', 'operator', 'out', 'override', 'package', 'param',
      'private', 'property', 'protected', 'public', 'receiver', 'reified', 'return',
      'sealed', 'set', 'super', 'suspend', 'tailrec', 'this', 'throw', 'true', 'try',
      'typealias', 'typeof', 'val', 'var', 'vararg', 'when', 'where', 'while'],
    executeCmd: 'kotlin {file}',
    repl: 'kotlinc',
    packageManager: 'gradle',
    family: 'web',
  },
  {
    id: 'csharp', name: 'C#', extensions: ['.cs'],
    lineComment: '//', blockComment: ['/*', '*/'],
    stringDelimiters: ['"', "'"],
    keywords: ['abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch',
      'char', 'checked', 'class', 'const', 'continue', 'decimal', 'default', 'delegate',
      'do', 'double', 'else', 'enum', 'event', 'explicit', 'extern', 'false', 'finally',
      'fixed', 'float', 'for', 'foreach', 'goto', 'if', 'implicit', 'in', 'int',
      'interface', 'internal', 'is', 'lock', 'long', 'namespace', 'new', 'null',
      'object', 'operator', 'out', 'override', 'params', 'private', 'protected',
      'public', 'readonly', 'record', 'ref', 'return', 'sbyte', 'sealed', 'short',
      'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw',
      'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort',
      'using', 'var', 'virtual', 'void', 'volatile', 'while', 'yield', 'async', 'await'],
    compileCmd: 'dotnet build',
    executeCmd: 'dotnet run',
    packageManager: 'nuget',
    family: 'web',
  },
];

// ─── Language Detection ───────────────────────────────────────────

const _extMap = new Map<string, LanguageSpec>();
for (const lang of LANGUAGES) {
  for (const ext of lang.extensions) {
    _extMap.set(ext, lang);
  }
}

export function detectLanguage(filename: string): LanguageSpec | null {
  const dot = filename.lastIndexOf('.');
  if (dot === -1) {
    if (filename === 'Makefile') return LANGUAGES.find(l => l.id === 'c') ?? null;
    if (filename === 'Dockerfile') return LANGUAGES.find(l => l.id === 'bash') ?? null;
    return null;
  }
  const ext = filename.slice(dot).toLowerCase();
  return _extMap.get(ext) ?? null;
}

export function getExecuteCommand(lang: LanguageSpec, filePath: string): string | null {
  if (lang.executeCmd) {
    const out = filePath.replace(/\.[^.]+$/, '');
    return lang.executeCmd
      .replace('{file}', filePath)
      .replace('{out}', out)
      .replace('{classname}', filePath.replace(/\.java$/, '').split(/[/\\]/).pop() ?? '');
  }
  return null;
}

export function getCompileCommand(lang: LanguageSpec, filePath: string): string | null {
  if (lang.compileCmd) {
    const out = filePath.replace(/\.[^.]+$/, '');
    return lang.compileCmd
      .replace('{file}', filePath)
      .replace('{out}', out);
  }
  return null;
}

// ─── Syntax Tokenizer ─────────────────────────────────────────────
// Basic tokenizer for ALL languages — no LSP needed

export type TokenType = 'keyword' | 'string' | 'comment' | 'number' | 'type' | 'operator' | 'text';

export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

export function tokenizeLine(line: string, lang: LanguageSpec): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // Skip whitespace
    if (/\s/.test(line[i])) { i++; continue; }

    // Line comment
    if (lang.lineComment && line.slice(i).startsWith(lang.lineComment)) {
      tokens.push({ type: 'comment', value: line.slice(i), start: i, end: line.length });
      break;
    }

    // Strings
    let matched = false;
    for (const delim of lang.stringDelimiters) {
      if (line.slice(i).startsWith(delim)) {
        let j = i + delim.length;
        while (j < line.length) {
          if (line[j] === '\\') { j += 2; continue; }
          if (line.slice(j).startsWith(delim)) { j += delim.length; break; }
          j++;
        }
        tokens.push({ type: 'string', value: line.slice(i, j), start: i, end: j });
        i = j;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Numbers
    if (/[0-9]/.test(line[i]) || (line[i] === '.' && /[0-9]/.test(line[i + 1] ?? ''))) {
      let j = i;
      while (j < line.length && /[0-9a-fA-FxXoObB._eE+-]/.test(line[j])) j++;
      tokens.push({ type: 'number', value: line.slice(i, j), start: i, end: j });
      i = j;
      continue;
    }

    // Words (keywords, types, identifiers)
    if (/[a-zA-Z_\u0600-\u06FF]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_\u0600-\u06FF]/.test(line[j])) j++;
      const word = line.slice(i, j);
      let type: TokenType = 'text';
      if (lang.keywords.includes(word)) type = 'keyword';
      else if (lang.builtinTypes?.includes(word)) type = 'type';
      tokens.push({ type, value: word, start: i, end: j });
      i = j;
      continue;
    }

    // Operators
    if (/[+\-*/%=<>!&|^~?:;,.()[\]{}@#$]/.test(line[i])) {
      tokens.push({ type: 'operator', value: line[i], start: i, end: i + 1 });
      i++;
      continue;
    }

    i++;
  }

  return tokens;
}

// ─── Stats ────────────────────────────────────────────────────────

export function getRuntimeStats() {
  const families = new Map<string, number>();
  for (const lang of LANGUAGES) {
    families.set(lang.family, (families.get(lang.family) ?? 0) + 1);
  }
  return {
    totalLanguages: LANGUAGES.length,
    totalExtensions: LANGUAGES.reduce((sum, l) => sum + l.extensions.length, 0),
    executable: LANGUAGES.filter(l => l.executeCmd).length,
    compilable: LANGUAGES.filter(l => l.compileCmd).length,
    withRepl: LANGUAGES.filter(l => l.repl).length,
    families: Object.fromEntries(families),
  };
}
