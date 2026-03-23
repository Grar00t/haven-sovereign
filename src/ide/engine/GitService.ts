// ══════════════════════════════════════════════════════════════
// GitService — Sovereign Local Git Operations
// Real git operations via isomorphic-git + lightning-fs (IndexedDB).
// Zero cloud. Zero GitHub dependency. 100% on-device.
// Built by أبو خوارزم — Sulaiman Alshammari
// ══════════════════════════════════════════════════════════════

import git from 'isomorphic-git';
import LightningFS from '@isomorphic-git/lightning-fs';

// ── Types ────────────────────────────────────────────────────

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  email: string;
  timestamp: number;       // Unix seconds
  timeAgo: string;         // Human-readable
  parentHashes: string[];
}

export interface GitFileStatus {
  filepath: string;
  /** HEAD status → workdir status → stage status, e.g. *modified, *added */
  headStatus: number;
  workdirStatus: number;
  stageStatus: number;
  /** Simplified status string for UI */
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'unmodified' | 'absent';
  staged: boolean;
}

export interface GitBranch {
  name: string;
  current: boolean;
}

export interface GitServiceStatus {
  initialized: boolean;
  repoDir: string;
  branch: string;
  changedFiles: number;
  stagedFiles: number;
  commitCount: number;
}

// ── Lightning FS instance (IndexedDB-backed) ─────────────────

const lfs = new LightningFS('haven-git');
const fs = lfs.promises;

// ── Helpers ──────────────────────────────────────────────────

function timeAgo(unixSeconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(unixSeconds * 1000).toLocaleDateString();
}

/** Matrix row indices from isomorphic-git statusMatrix */
const HEAD = 1;
const WORKDIR = 2;
const STAGE = 3;

function resolveStatus(row: [string, number, number, number]): GitFileStatus {
  const [filepath, head, workdir, stage] = row;
  let status: GitFileStatus['status'] = 'unmodified';
  let staged = false;

  // Determine simplified status
  if (head === 0 && workdir === 2 && stage === 0) {
    status = 'untracked';
  } else if (head === 0 && workdir === 2 && stage === 2) {
    status = 'added';
    staged = true;
  } else if (head === 0 && workdir === 2 && stage === 3) {
    status = 'added';
    staged = true;
  } else if (head === 1 && workdir === 2 && stage === 1) {
    status = 'modified';
  } else if (head === 1 && workdir === 2 && stage === 2) {
    status = 'modified';
    staged = true;
  } else if (head === 1 && workdir === 2 && stage === 3) {
    status = 'modified';
    staged = true;
  } else if (head === 1 && workdir === 0 && stage === 0) {
    status = 'deleted';
    staged = true;
  } else if (head === 1 && workdir === 0 && stage === 1) {
    status = 'deleted';
  } else if (head === 1 && workdir === 1 && stage === 1) {
    status = 'unmodified';
  } else if (stage !== head) {
    // Catch-all for any staged change
    staged = true;
    if (workdir === 0) status = 'deleted';
    else if (head === 0) status = 'added';
    else status = 'modified';
  }

  return { filepath, headStatus: head, workdirStatus: workdir, stageStatus: stage, status, staged };
}

// ── GitService class ─────────────────────────────────────────

class GitService {
  private _dir = '/haven-repo';
  private _author = { name: 'أبو خوارزم', email: 'sovereign@haven.sa' };
  private _initialized = false;
  private _listeners = new Set<() => void>();

  get dir(): string { return this._dir; }
  get initialized(): boolean { return this._initialized; }

  // ── Lifecycle ──────────────────────────────────────────────

  /**
   * Initialize or open existing repo at the given path.
   * If no .git exists, runs git init.
   */
  async init(dir?: string): Promise<boolean> {
    if (dir) this._dir = dir;
    try {
      // Check if already a git repo
      try {
        await git.resolveRef({ fs, dir: this._dir, ref: 'HEAD' });
        this._initialized = true;
        this.emit();
        return true;
      } catch {
        // Not a repo yet — init it
      }

      // Ensure directory exists
      try { await fs.mkdir(this._dir); } catch { /* exists */ }

      await git.init({ fs, dir: this._dir, defaultBranch: 'main' });
      this._initialized = true;
      this.emit();
      return true;
    } catch (err) {
      console.error('[GitService] init failed:', err);
      return false;
    }
  }

  /**
   * Sync files from HAVEN's virtual FS into the git working directory.
   * This bridges the File System Access API / virtual FS with isomorphic-git's lightning-fs.
   */
  async syncFiles(files: Array<{ path: string; content: string }>): Promise<void> {
    for (const file of files) {
      const fullPath = `${this._dir}/${file.path}`;
      // Ensure parent directories exist
      const parts = fullPath.split('/');
      for (let i = 1; i < parts.length - 1; i++) {
        const dirPath = parts.slice(0, i + 1).join('/');
        try { await fs.mkdir(dirPath); } catch { /* exists */ }
      }
      await fs.writeFile(fullPath, file.content, 'utf8');
    }
    this.emit();
  }

  /**
   * Remove a file from the git working directory.
   */
  async removeFile(filepath: string): Promise<void> {
    try {
      await fs.unlink(`${this._dir}/${filepath}`);
      await git.remove({ fs, dir: this._dir, filepath });
    } catch { /* file may not exist */ }
    this.emit();
  }

  // ── Status ─────────────────────────────────────────────────

  /**
   * Get the status matrix for all files in the repo.
   * Returns files that are changed (not unmodified).
   */
  async status(): Promise<GitFileStatus[]> {
    if (!this._initialized) return [];
    try {
      const matrix = await git.statusMatrix({ fs, dir: this._dir });
      return matrix
        .map(row => resolveStatus(row as [string, number, number, number]))
        .filter(s => s.status !== 'unmodified' && s.status !== 'absent');
    } catch (err) {
      console.error('[GitService] status failed:', err);
      return [];
    }
  }

  /**
   * Get the current branch name.
   */
  async currentBranch(): Promise<string> {
    if (!this._initialized) return 'main';
    try {
      const branch = await git.currentBranch({ fs, dir: this._dir });
      return branch || 'main';
    } catch {
      return 'main';
    }
  }

  /**
   * List all local branches.
   */
  async listBranches(): Promise<GitBranch[]> {
    if (!this._initialized) return [{ name: 'main', current: true }];
    try {
      const branches = await git.listBranches({ fs, dir: this._dir });
      const current = await this.currentBranch();
      return branches.map(name => ({ name, current: name === current }));
    } catch {
      return [{ name: 'main', current: true }];
    }
  }

  // ── Staging ────────────────────────────────────────────────

  /**
   * Stage a file (git add).
   */
  async add(filepath: string): Promise<void> {
    await git.add({ fs, dir: this._dir, filepath });
    this.emit();
  }

  /**
   * Stage all changed files.
   */
  async addAll(): Promise<number> {
    const statuses = await this.status();
    let count = 0;
    for (const s of statuses) {
      if (!s.staged && s.status !== 'deleted') {
        await git.add({ fs, dir: this._dir, filepath: s.filepath });
        count++;
      } else if (!s.staged && s.status === 'deleted') {
        await git.remove({ fs, dir: this._dir, filepath: s.filepath });
        count++;
      }
    }
    this.emit();
    return count;
  }

  /**
   * Unstage a file (reset to HEAD).
   */
  async unstage(filepath: string): Promise<void> {
    try {
      // Read the file from HEAD and write it back to the stage
      await git.resetIndex({ fs, dir: this._dir, filepath });
    } catch {
      // If file doesn't exist in HEAD (new file), remove from index
      try {
        await git.remove({ fs, dir: this._dir, filepath });
      } catch { /* ignore */ }
    }
    this.emit();
  }

  /**
   * Unstage all files.
   */
  async unstageAll(): Promise<void> {
    const statuses = await this.status();
    for (const s of statuses) {
      if (s.staged) {
        await this.unstage(s.filepath);
      }
    }
    this.emit();
  }

  /**
   * Discard working directory changes for a file (checkout from HEAD).
   */
  async discard(filepath: string): Promise<void> {
    try {
      await git.checkout({ fs, dir: this._dir, filepaths: [filepath], force: true });
    } catch {
      // If file was untracked, just remove it
      try {
        await fs.unlink(`${this._dir}/${filepath}`);
      } catch { /* ignore */ }
    }
    this.emit();
  }

  // ── Commits ────────────────────────────────────────────────

  /**
   * Create a commit with the currently staged files.
   */
  async commit(message: string, author?: { name: string; email: string }): Promise<string | null> {
    if (!this._initialized) return null;
    const auth = author || this._author;
    try {
      const sha = await git.commit({
        fs,
        dir: this._dir,
        message,
        author: { name: auth.name, email: auth.email },
      });
      this.emit();
      return sha;
    } catch (err) {
      console.error('[GitService] commit failed:', err);
      return null;
    }
  }

  /**
   * Get commit log (most recent first).
   */
  async log(depth = 50): Promise<GitCommit[]> {
    if (!this._initialized) return [];
    try {
      const commits = await git.log({ fs, dir: this._dir, depth });
      return commits.map(c => ({
        hash: c.oid.slice(0, 7),
        message: c.commit.message.trim(),
        author: c.commit.author.name,
        email: c.commit.author.email,
        timestamp: c.commit.author.timestamp,
        timeAgo: timeAgo(c.commit.author.timestamp),
        parentHashes: c.commit.parent,
      }));
    } catch {
      return [];
    }
  }

  // ── Branching ──────────────────────────────────────────────

  /**
   * Create a new branch.
   */
  async createBranch(name: string, checkout = true): Promise<boolean> {
    try {
      await git.branch({ fs, dir: this._dir, ref: name, checkout });
      this.emit();
      return true;
    } catch (err) {
      console.error('[GitService] createBranch failed:', err);
      return false;
    }
  }

  /**
   * Checkout a branch.
   */
  async checkout(branch: string): Promise<boolean> {
    try {
      await git.checkout({ fs, dir: this._dir, ref: branch });
      this.emit();
      return true;
    } catch (err) {
      console.error('[GitService] checkout failed:', err);
      return false;
    }
  }

  /**
   * Delete a branch (cannot delete current branch).
   */
  async deleteBranch(name: string): Promise<boolean> {
    try {
      const current = await this.currentBranch();
      if (name === current) return false;
      await git.deleteBranch({ fs, dir: this._dir, ref: name });
      this.emit();
      return true;
    } catch {
      return false;
    }
  }

  // ── Diff ───────────────────────────────────────────────────

  /**
   * Get the diff for a single file (working dir vs HEAD).
   * Returns the raw file contents from HEAD and working dir.
   */
  async diffFile(filepath: string): Promise<{ old: string; new: string } | null> {
    try {
      let oldContent = '';
      try {
        const headOid = await git.resolveRef({ fs, dir: this._dir, ref: 'HEAD' });
        const { blob } = await git.readBlob({
          fs, dir: this._dir, oid: headOid, filepath,
        });
        oldContent = new TextDecoder().decode(blob);
      } catch {
        // File doesn't exist in HEAD (new file)
      }

      let newContent = '';
      try {
        const raw = await fs.readFile(`${this._dir}/${filepath}`, { encoding: 'utf8' });
        newContent = typeof raw === 'string' ? raw : new TextDecoder().decode(raw as Uint8Array);
      } catch {
        // File deleted in working dir
      }

      return { old: oldContent, new: newContent };
    } catch {
      return null;
    }
  }

  // ── Author ─────────────────────────────────────────────────

  setAuthor(name: string, email: string): void {
    this._author = { name, email };
  }

  getAuthor(): { name: string; email: string } {
    return { ...this._author };
  }

  // ── Service status ─────────────────────────────────────────

  async getServiceStatus(): Promise<GitServiceStatus> {
    const statuses = await this.status();
    const branch = await this.currentBranch();
    const log = await this.log(1000);
    return {
      initialized: this._initialized,
      repoDir: this._dir,
      branch,
      changedFiles: statuses.filter(s => !s.staged).length,
      stagedFiles: statuses.filter(s => s.staged).length,
      commitCount: log.length,
    };
  }

  // ── Event system ───────────────────────────────────────────

  onChange(fn: () => void): () => void {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  private emit(): void {
    this._listeners.forEach(fn => fn());
  }
}

// ── Singleton ────────────────────────────────────────────────
export const gitService = new GitService();
