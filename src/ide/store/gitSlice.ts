import type { StateCreator } from 'zustand';
import type { FileNode } from '../types';
import type { IDEState } from './types';
import { collectGitChanges } from './helpers';
import { gitService, type GitCommit, type GitFileStatus, type GitBranch } from '../engine/GitService';
import { ollamaService } from '../engine/OllamaService';
import { modelRouter } from '../engine/ModelRouter';

export interface GitSlice {
  stagedFiles: Set<string>;
  stageFile: (fileId: string) => void;
  unstageFile: (fileId: string) => void;
  stageAll: () => void;
  unstageAll: () => void;
  discardChanges: (fileId: string) => void;
  commitChanges: (message: string) => void;
  gitLog: { hash: string; msg: string; time: string; author: string }[];
  gitInitialized: boolean;
  gitBranch: string;
  gitStatuses: GitFileStatus[];
  gitBranches: GitBranch[];
  gitRealLog: GitCommit[];
  initGit: () => Promise<void>;
  refreshGitStatus: () => Promise<void>;
  syncFilesToGit: () => Promise<void>;
  gitAddFile: (filepath: string) => Promise<void>;
  gitAddAll: () => Promise<void>;
  gitUnstageFile: (filepath: string) => Promise<void>;
  gitUnstageAll: () => Promise<void>;
  gitDiscardFile: (filepath: string) => Promise<void>;
  gitCommit: (message: string) => Promise<string | null>;
  gitCheckoutBranch: (name: string) => Promise<void>;
  gitCreateBranch: (name: string) => Promise<void>;
  gitDeleteBranch: (name: string) => Promise<void>;
  gitDiffFile: (filepath: string) => Promise<{ old: string; new: string } | null>;
  generateCommitMsg: () => Promise<string | null>;
}

export const createGitSlice: StateCreator<IDEState, [], [], GitSlice> = (set, get) => ({
  stagedFiles: new Set<string>(),

  stageFile: (fileId: string) => {
    set((s) => {
      const next = new Set(s.stagedFiles);
      next.add(fileId);
      return { stagedFiles: next };
    });
  },

  unstageFile: (fileId: string) => {
    set((s) => {
      const next = new Set(s.stagedFiles);
      next.delete(fileId);
      return { stagedFiles: next };
    });
  },

  stageAll: () => {
    const changes = collectGitChanges(get().files);
    set({ stagedFiles: new Set(changes.map(c => c.node.id)) });
  },

  unstageAll: () => {
    set({ stagedFiles: new Set<string>() });
  },

  discardChanges: (fileId: string) => {
    const clearStatus = (nodes: FileNode[]): FileNode[] =>
      nodes.map(n => {
        if (n.id === fileId) return { ...n, gitStatus: null };
        if (n.children) return { ...n, children: clearStatus(n.children) };
        return n;
      });
    set((s) => ({
      files: clearStatus(s.files),
      stagedFiles: (() => { const next = new Set(s.stagedFiles); next.delete(fileId); return next; })(),
    }));
    get().addNotification({ type: 'warning', message: 'Changes discarded' });
  },

  commitChanges: (message: string) => {
    const state = get();
    if (state.stagedFiles.size === 0) {
      state.addNotification({ type: 'warning', message: 'Nothing staged to commit' });
      return;
    }
    const stagedIds = state.stagedFiles;
    const clearStaged = (nodes: FileNode[]): FileNode[] =>
      nodes.map(n => {
        if (stagedIds.has(n.id)) return { ...n, gitStatus: null };
        if (n.children) return { ...n, children: clearStaged(n.children) };
        return n;
      });
    const hash = Math.random().toString(36).substring(2, 9);
    set((s) => ({
      files: clearStaged(s.files),
      stagedFiles: new Set<string>(),
      gitLog: [
        { hash, msg: message, time: 'just now', author: 'أبو خوارزم' },
        ...s.gitLog,
      ],
    }));
    state.addNotification({ type: 'success', message: `Committed ${stagedIds.size} file(s): ${message}` });
    state.persistToIDB();
  },

  gitLog: [
    { hash: 'a1b2c3d', msg: 'feat: initialize sovereign algorithm', time: '2h ago', author: 'أبو خوارزم' },
    { hash: 'e4f5g6h', msg: 'style: add neon-green theme', time: '5h ago', author: 'أبو خوارزم' },
    { hash: 'i7j8k9l', msg: 'init: project setup', time: '1d ago', author: 'أبو خوارزم' },
  ],

  // Real Git (isomorphic-git)
  gitInitialized: false,
  gitBranch: 'main',
  gitStatuses: [],
  gitBranches: [{ name: 'main', current: true }],
  gitRealLog: [],

  initGit: async () => {
    const ok = await gitService.init();
    if (!ok) {
      get().addNotification({ type: 'error', message: 'Failed to initialize git repo' });
      return;
    }
    set({ gitInitialized: true });
    await get().syncFilesToGit();
    const log = await gitService.log(1);
    if (log.length === 0) {
      await gitService.addAll();
      await gitService.commit('init: sovereign algorithm born 🇸🇦');
    }
    await get().refreshGitStatus();
    get().addNotification({ type: 'success', message: 'Git initialized — sovereign version control active' });
  },

  syncFilesToGit: async () => {
    const flatFiles: { path: string; content: string }[] = [];
    const walk = (nodes: FileNode[], prefix: string) => {
      for (const node of nodes) {
        const fullPath = prefix ? `${prefix}/${node.name}` : node.name;
        if (node.type === 'file' && node.content !== undefined) {
          flatFiles.push({ path: fullPath, content: node.content });
        }
        if (node.children) walk(node.children, fullPath);
      }
    };
    walk(get().files, '');
    await gitService.syncFiles(flatFiles);
  },

  refreshGitStatus: async () => {
    if (!get().gitInitialized) return;
    const [statuses, branch, branches, log] = await Promise.all([
      gitService.status(),
      gitService.currentBranch(),
      gitService.listBranches(),
      gitService.log(50),
    ]);
    set({ gitStatuses: statuses, gitBranch: branch, gitBranches: branches, gitRealLog: log });
  },

  gitAddFile: async (filepath: string) => {
    await gitService.add(filepath);
    await get().refreshGitStatus();
  },

  gitAddAll: async () => {
    await get().syncFilesToGit();
    const count = await gitService.addAll();
    await get().refreshGitStatus();
    get().addNotification({ type: 'info', message: `Staged ${count} file(s)` });
  },

  gitUnstageFile: async (filepath: string) => {
    await gitService.unstage(filepath);
    await get().refreshGitStatus();
  },

  gitUnstageAll: async () => {
    await gitService.unstageAll();
    await get().refreshGitStatus();
  },

  gitDiscardFile: async (filepath: string) => {
    await gitService.discard(filepath);
    await get().refreshGitStatus();
    get().addNotification({ type: 'warning', message: `Discarded changes: ${filepath}` });
  },

  gitCommit: async (message: string) => {
    await get().syncFilesToGit();
    const sha = await gitService.commit(message);
    if (sha) {
      await get().refreshGitStatus();
      get().addNotification({ type: 'success', message: `Committed: ${sha.slice(0, 7)} — ${message}` });
    } else {
      get().addNotification({ type: 'error', message: 'Commit failed — are there staged changes?' });
    }
    return sha;
  },

  gitCheckoutBranch: async (name: string) => {
    const ok = await gitService.checkout(name);
    if (ok) {
      await get().refreshGitStatus();
      get().addNotification({ type: 'info', message: `Switched to branch: ${name}` });
    }
  },

  gitCreateBranch: async (name: string) => {
    const ok = await gitService.createBranch(name, true);
    if (ok) {
      await get().refreshGitStatus();
      get().addNotification({ type: 'success', message: `Created & checked out: ${name}` });
    }
  },

  gitDeleteBranch: async (name: string) => {
    const ok = await gitService.deleteBranch(name);
    if (ok) {
      await get().refreshGitStatus();
      get().addNotification({ type: 'info', message: `Deleted branch: ${name}` });
    } else {
      get().addNotification({ type: 'error', message: `Cannot delete branch: ${name}` });
    }
  },

  gitDiffFile: async (filepath: string) => {
    return gitService.diffFile(filepath);
  },

  generateCommitMsg: async () => {
    const { gitStatuses } = get();
    const changed = gitStatuses.filter(s => s.status !== 'unmodified');
    const target = changed.filter(s => s.staged);
    const files = target.length > 0 ? target : changed;
    if (files.length === 0) return null;

    const diffs: string[] = [];
    for (const f of files.slice(0, 8)) {
      try {
        const d = await gitService.diffFile(f.filepath);
        if (d) {
          diffs.push(`${f.status}: ${f.filepath}\n-: ${d.old.slice(0, 800)}\n+: ${d.new.slice(0, 800)}`);
        } else {
          diffs.push(`${f.status}: ${f.filepath} [new file]`);
        }
      } catch {
        diffs.push(`${f.status}: ${f.filepath}`);
      }
    }

    try {
      const prompt = `Generate a single concise git commit message (conventional commits style: type(scope): description) for these changes. Output ONLY the message, no markdown.\n\n${diffs.join('\n\n')}`;
      const model = modelRouter.resolveModel('cognitive');
      if (ollamaService.getStatus() !== 'connected') return null;
      const result = await ollamaService.chat({
        model,
        messages: [
          { role: 'system', content: 'You are a git commit message generator. Output ONLY the commit message line, nothing else.' },
          { role: 'user', content: prompt },
        ],
        options: { temperature: 0.3, num_predict: 128 },
      });
      return result?.message?.content?.trim()?.replace(/^```.*\n?/, '')?.replace(/```$/, '')?.trim() || null;
    } catch {
      const types = new Set(files.map(f => f.status));
      const scope = files.length === 1 ? files[0].filepath.split('/').pop() : `${files.length} files`;
      return `${[...types].join('/')}: update ${scope}`;
    }
  },
});
