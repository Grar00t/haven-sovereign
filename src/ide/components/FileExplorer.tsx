import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useIDEStore } from '../useIDEStore';
import { FILE_ICONS, getFileIcon } from '../types';
import type { FileNode } from '../types';
import {
  ChevronDown, ChevronRight, FolderOpen, Folder, File,
  FilePlus, FolderPlus, Pencil, Trash2, HardDrive, FolderOpenDot,
  Search,
} from 'lucide-react';

function getGitStatusColor(status: string | null | undefined): string | null {
  switch (status) {
    case 'modified': return '#fbbf24';
    case 'added': return '#22c55e';
    case 'deleted': return '#ef4444';
    case 'untracked': return '#60a5fa';
    case 'renamed': return '#c084fc';
    default: return null;
  }
}

function FileTreeNode({ node, depth, path }: { node: FileNode; depth: number; path: string; key?: string }) {
  const {
    expandedFolders, toggleFolder, openFile, currentTheme,
    createFile, createFolder, deleteFile, renameFile,
  } = useIDEStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const [isCreating, setIsCreating] = useState<'file' | 'folder' | null>(null);
  const [newFileName, setNewFileName] = useState('');

  const isExpanded = expandedFolders.has(node.id);
  const isFolder = node.type === 'folder';
  const currentPath = `${path}/${node.name}`;
  const gitColor = getGitStatusColor(node.gitStatus);

  const handleClick = () => {
    if (isFolder) toggleFolder(node.id);
    else openFile(node, currentPath);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleRename = () => {
    if (renameValue.trim() && renameValue !== node.name) renameFile(node.id, renameValue.trim());
    setIsRenaming(false);
    setContextMenu(null);
  };

  const handleCreateItem = () => {
    if (newFileName.trim()) {
      if (isCreating === 'folder') createFolder(node.id, newFileName.trim());
      else createFile(node.id, newFileName.trim());
      setIsCreating(null);
      setNewFileName('');
      if (!isExpanded) toggleFolder(node.id);
    }
  };

  return (
    <div>
      <div
        className="flex items-center gap-1 px-2 py-[3px] cursor-pointer group text-sm"
        style={{ paddingLeft: `${depth * 16 + 8}px`, color: gitColor || currentTheme.text }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = currentTheme.selection; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        {isFolder && (
          <span className="w-4 flex items-center justify-center shrink-0 opacity-60">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        {!isFolder && <span className="w-4" />}
        <span className="flex items-center justify-center w-4 shrink-0" style={{ color: isFolder ? (isExpanded ? currentTheme.accent : currentTheme.textMuted) : currentTheme.textMuted }}>
          {isFolder ? (isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />) : <File size={14} />}
        </span>
        {isRenaming ? (
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsRenaming(false); }}
            className="bg-transparent border px-1 text-sm outline-none flex-1"
            style={{ borderColor: currentTheme.accent, color: currentTheme.text }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate select-none" style={{ opacity: isFolder ? 1 : 0.85 }}>
            {node.name}
          </span>
        )}

        {/* Git status indicator */}
        {node.gitStatus && (
          <span className="text-xs font-mono font-bold ml-auto mr-1" style={{ color: gitColor || undefined }}>
            {node.gitStatus === 'modified' ? 'M' : node.gitStatus === 'added' ? 'A' : node.gitStatus === 'deleted' ? 'D' : node.gitStatus === 'untracked' ? 'U' : 'R'}
          </span>
        )}

        {/* Hover actions */}
        <div className={`${node.gitStatus ? '' : 'ml-auto'} hidden group-hover:flex gap-1`}>
          {isFolder && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setIsCreating('file'); if (!isExpanded) toggleFolder(node.id); }}
                className="opacity-60 hover:opacity-100" title="New File"
              ><FilePlus size={13} /></button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsCreating('folder'); if (!isExpanded) toggleFolder(node.id); }}
                className="opacity-60 hover:opacity-100" title="New Folder"
              ><FolderPlus size={13} /></button>
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setIsRenaming(true); setRenameValue(node.name); }}
            className="opacity-60 hover:opacity-100" title="Rename"
          ><Pencil size={13} /></button>
          {node.id !== 'root' && (
            <button
              onClick={(e) => { e.stopPropagation(); deleteFile(node.id); }}
              className="opacity-60 hover:opacity-100 text-red-400" title="Delete"
            ><Trash2 size={13} /></button>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 py-1 rounded shadow-xl text-sm min-w-[180px]"
            style={{ left: contextMenu.x, top: contextMenu.y, backgroundColor: currentTheme.sidebar, border: `1px solid ${currentTheme.border}`, color: currentTheme.text }}
          >
            {isFolder && (
              <>
                <button className="w-full text-left px-3 py-1.5 hover:bg-white/10 text-xs flex items-center gap-2" onClick={() => { setIsCreating('file'); setContextMenu(null); }}>
                  <FilePlus size={12} /> New File
                </button>
                <button className="w-full text-left px-3 py-1.5 hover:bg-white/10 text-xs flex items-center gap-2" onClick={() => { setIsCreating('folder'); setContextMenu(null); }}>
                  <FolderPlus size={12} /> New Folder
                </button>
                <div className="border-t my-1" style={{ borderColor: currentTheme.border }} />
              </>
            )}
            <button className="w-full text-left px-3 py-1.5 hover:bg-white/10 text-xs flex items-center gap-2" onClick={() => { setIsRenaming(true); setRenameValue(node.name); setContextMenu(null); }}>
              <Pencil size={12} /> Rename
            </button>
            {node.id !== 'root' && (
              <button className="w-full text-left px-3 py-1.5 hover:bg-white/10 text-red-400 text-xs flex items-center gap-2" onClick={() => { deleteFile(node.id); setContextMenu(null); }}>
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>
        </>
      )}

      {/* New file/folder input */}
      {isCreating && isFolder && (
        <div style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }} className="flex items-center gap-1 px-2 py-1">
          <span className="flex items-center justify-center w-4 shrink-0" style={{ color: currentTheme.textMuted }}>
            {isCreating === 'folder' ? <FolderPlus size={14} /> : <FilePlus size={14} />}
          </span>
          <input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onBlur={() => { setIsCreating(null); setNewFileName(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateItem(); if (e.key === 'Escape') { setIsCreating(null); setNewFileName(''); } }}
            placeholder={isCreating === 'folder' ? 'folder name...' : 'filename...'}
            className="bg-transparent border px-1 text-sm outline-none flex-1"
            style={{ borderColor: currentTheme.accent, color: currentTheme.text }}
            autoFocus
          />
        </div>
      )}

      {/* Children */}
      {isFolder && isExpanded && node.children && (
        <div>
          {node.children
            .sort((a, b) => { if (a.type === b.type) return a.name.localeCompare(b.name); return a.type === 'folder' ? -1 : 1; })
            .map((child) => (
              <FileTreeNode key={child.id} node={child} depth={depth + 1} path={currentPath} />
            ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer() {
  const { files, currentTheme, sidebarWidth, openRealFolder, isRealFS } = useIDEStore();
  const [filterText, setFilterText] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  // Count total files for performance indicator
  const fileCount = useMemo(() => {
    let count = 0;
    const countNodes = (nodes: FileNode[]) => {
      for (const n of nodes) {
        if (n.type === 'file') count++;
        if (n.children) countNodes(n.children);
      }
    };
    countNodes(files);
    return count;
  }, [files]);

  // Filter tree nodes by name (case-insensitive)
  const filteredFiles = useMemo(() => {
    if (!filterText.trim()) return files;
    const lower = filterText.toLowerCase();
    const filterTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.reduce<FileNode[]>((acc, node) => {
        if (node.name.toLowerCase().includes(lower)) {
          acc.push(node);
        } else if (node.children) {
          const filtered = filterTree(node.children);
          if (filtered.length > 0) {
            acc.push({ ...node, children: filtered });
          }
        }
        return acc;
      }, []);
    };
    return filterTree(files);
  }, [files, filterText]);

  return (
    <div
      className="h-full overflow-y-auto overflow-x-hidden select-none"
      style={{ width: sidebarWidth, backgroundColor: currentTheme.sidebar }}
    >
      <div
        className="px-4 py-2 text-xs font-semibold uppercase tracking-wider flex items-center justify-between"
        style={{ color: currentTheme.textMuted }}
      >
        <span className="flex items-center gap-1.5">
          Explorer
          <span className="opacity-50 text-[10px] font-normal normal-case">({fileCount})</span>
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowFilter(v => !v)}
            className="opacity-60 hover:opacity-100 transition-opacity" title="Filter Files"
          ><Search size={13} /></button>
          <button
            onClick={() => openRealFolder()}
            className="opacity-60 hover:opacity-100 transition-opacity" title="Open Folder"
          ><FolderOpenDot size={14} /></button>
          <button
            onClick={() => useIDEStore.getState().createFile('src', `untitled-${Date.now() % 1000}.ts`)}
            className="opacity-60 hover:opacity-100 transition-opacity" title="New File"
          ><FilePlus size={14} /></button>
          <button
            onClick={() => useIDEStore.getState().createFolder('src', `folder-${Date.now() % 1000}`)}
            className="opacity-60 hover:opacity-100 transition-opacity" title="New Folder"
          ><FolderPlus size={14} /></button>
        </div>
      </div>

      {/* Quick filter */}
      {showFilter && (
        <div className="px-3 mb-1">
          <input
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="Filter files..."
            className="w-full bg-transparent border rounded px-2 py-1 text-xs outline-none focus:ring-1"
            style={{ borderColor: currentTheme.border, color: currentTheme.text }}
            autoFocus
          />
        </div>
      )}

      {/* Live file system indicator */}
      {isRealFS && (
        <div
          className="mx-3 mb-1 px-2 py-1 rounded text-xs flex items-center gap-1.5"
          style={{ backgroundColor: '#22c55e15', color: '#22c55e', border: '1px solid #22c55e30' }}
        >
          <HardDrive size={12} />
          <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#22c55e' }} />
          Connected to real file system
        </div>
      )}

      {filteredFiles.map((node) => (
        <FileTreeNode key={node.id} node={node} depth={0} path="" />
      ))}

      {filterText && filteredFiles.length === 0 && (
        <div className="px-4 py-4 text-center text-xs opacity-40" style={{ color: currentTheme.textMuted }}>
          No files match "{filterText}"
        </div>
      )}
    </div>
  );
}
