import type { FileNode } from '../types';

// ── Language detection ────────────────────────────────────────────
export function getLanguageFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    css: 'css', html: 'html', json: 'json', md: 'markdown',
    py: 'python', rs: 'rust', go: 'go', java: 'java',
    cpp: 'cpp', c: 'c', sh: 'shell', yml: 'yaml', yaml: 'yaml',
  };
  return map[ext] || 'plaintext';
}

// ── Binary/image detection ────────────────────────────────────────
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp']);
const BINARY_EXTS = new Set(['woff', 'woff2', 'ttf', 'otf', 'eot', 'zip', 'tar', 'gz', 'pdf', 'exe', 'dll', 'so', 'dylib', 'wasm', 'mp3', 'mp4', 'wav', 'ogg', 'avi']);

export function isImageFile(name: string): boolean {
  return IMAGE_EXTS.has(name.split('.').pop()?.toLowerCase() || '');
}
export function isBinaryFile(name: string): boolean {
  return BINARY_EXTS.has(name.split('.').pop()?.toLowerCase() || '');
}

// ── Tree manipulation ─────────────────────────────────────────────
export function addFileToTree(nodes: FileNode[], parentId: string, newFile: FileNode): FileNode[] {
  return nodes.map((node) => {
    if (node.id === parentId && node.type === 'folder') {
      return { ...node, children: [...(node.children || []), newFile] };
    }
    if (node.children) {
      return { ...node, children: addFileToTree(node.children, parentId, newFile) };
    }
    return node;
  });
}

export function removeFromTree(nodes: FileNode[], id: string): FileNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => node.children ? { ...node, children: removeFromTree(node.children, id) } : node);
}

export function renameInTree(nodes: FileNode[], id: string, newName: string): FileNode[] {
  return nodes.map((node) => {
    if (node.id === id) return { ...node, name: newName };
    if (node.children) return { ...node, children: renameInTree(node.children, id, newName) };
    return node;
  });
}

export function collectGitChanges(nodes: FileNode[], path = ''): { node: FileNode; path: string }[] {
  const results: { node: FileNode; path: string }[] = [];
  for (const node of nodes) {
    const currentPath = path ? `${path}/${node.name}` : node.name;
    if (node.type === 'file' && node.gitStatus) results.push({ node, path: currentPath });
    if (node.children) results.push(...collectGitChanges(node.children, currentPath));
  }
  return results;
}

// ── IndexedDB helpers ─────────────────────────────────────────────
const IDB_NAME = 'haven-ide';
const IDB_STORE = 'projects';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(IDB_STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbPut(key: string, value: unknown): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => { db.close(); resolve(req.result as T | undefined); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

// ── File System Access API helpers ────────────────────────────────
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.next', '__pycache__', '.venv', '.turbo', '.cache']);
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB text limit

export async function readDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  fileHandles: Map<string, FileSystemFileHandle>,
  parentPath: string,
  depth = 0,
): Promise<FileNode[]> {
  if (depth > 8) return [];
  const children: FileNode[] = [];

  for await (const entry of (dirHandle as FileSystemDirectoryHandle & { values(): AsyncIterableIterator<FileSystemHandle> }).values()) {
    if (entry.kind === 'directory') {
      if (SKIP_DIRS.has(entry.name)) continue;
      const folderId = `${parentPath}/${entry.name}`;
      const subChildren = await readDirectoryHandle(entry as FileSystemDirectoryHandle, fileHandles, folderId, depth + 1);
      children.push({ id: folderId, name: entry.name, type: 'folder', children: subChildren });
    } else {
      const fileHandle = entry as FileSystemFileHandle;
      const fileId = `${parentPath}/${entry.name}`;
      fileHandles.set(fileId, fileHandle);

      if (isBinaryFile(entry.name)) {
        children.push({ id: fileId, name: entry.name, type: 'file', language: 'plaintext', content: `[Binary file: ${entry.name}]`, gitStatus: null });
        continue;
      }

      let content = '';
      if (isImageFile(entry.name)) {
        try {
          const file = await fileHandle.getFile();
          if (file.size < MAX_FILE_SIZE) {
            const buf = await file.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
            content = `data:${file.type};base64,${base64}`;
          } else {
            content = `[Image too large: ${(file.size / 1024 / 1024).toFixed(1)} MB]`;
          }
        } catch { content = '[Could not read image]'; }
      } else {
        try {
          const file = await fileHandle.getFile();
          if (file.size > MAX_FILE_SIZE) {
            content = `[File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB — open in external editor]`;
          } else {
            content = await file.text();
          }
        } catch { content = '[Could not read file]'; }
      }

      children.push({
        id: fileId, name: entry.name, type: 'file',
        language: getLanguageFromName(entry.name), content, gitStatus: null,
      });
    }
  }

  children.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return children;
}

// ── Drag & Drop helper ────────────────────────────────────────────
export async function processDropEntry(
  entry: FileSystemEntry,
  parentId: string,
  fileHandles: Map<string, FileSystemFileHandle>,
): Promise<FileNode | null> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      (entry as FileSystemFileEntry).file(async (file) => {
        const id = `${parentId}/${entry.name}`;
        if (isBinaryFile(entry.name)) {
          resolve({ id, name: entry.name, type: 'file', language: 'plaintext', content: `[Binary: ${entry.name}]`, gitStatus: 'untracked' });
          return;
        }
        if (isImageFile(entry.name)) {
          try {
            const buf = await file.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
            resolve({ id, name: entry.name, type: 'file', language: 'plaintext', content: `data:${file.type};base64,${base64}`, gitStatus: 'untracked' });
          } catch {
            resolve({ id, name: entry.name, type: 'file', language: 'plaintext', content: '[Could not read image]', gitStatus: 'untracked' });
          }
          return;
        }
        const text = await file.text();
        resolve({ id, name: entry.name, type: 'file', language: getLanguageFromName(entry.name), content: text, gitStatus: 'untracked' });
      }, () => resolve(null));
    });
  }
  if (entry.isDirectory) {
    const dirReader = (entry as FileSystemDirectoryEntry).createReader();
    const entries: FileSystemEntry[] = await new Promise((resolve) => {
      dirReader.readEntries((e) => resolve(e));
    });
    const folderId = `${parentId}/${entry.name}`;
    const children: FileNode[] = [];
    for (const child of entries) {
      if (SKIP_DIRS.has(child.name)) continue;
      const node = await processDropEntry(child, folderId, fileHandles);
      if (node) children.push(node);
    }
    return { id: folderId, name: entry.name, type: 'folder', children };
  }
  return null;
}
