import React, { useState, useRef } from 'react';
import { useIDEStore } from '../useIDEStore';
import { getFileIcon } from '../types';

export function TabBar() {
  const {
    openTabs, activeTabId, setActiveTab, closeTab, currentTheme,
    pinTab, closeOtherTabs, closeTabsToRight, closeAllTabs, moveTab,
  } = useIDEStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  if (openTabs.length === 0) return null;

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, tabId });
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = (_e: React.DragEvent, idx: number) => {
    if (dragIdx !== null && dragIdx !== idx) {
      moveTab(dragIdx, idx);
    }
    setDragIdx(null);
    setDragOverIdx(null);
  };

  // Separate pinned and unpinned
  const pinnedTabs = openTabs.filter(t => t.isPinned);
  const unpinnedTabs = openTabs.filter(t => !t.isPinned);

  return (
    <>
      <div
        className="flex items-center overflow-x-auto shrink-0"
        style={{
          backgroundColor: currentTheme.bg,
          borderBottom: `1px solid ${currentTheme.border}`,
          minHeight: 36,
        }}
      >
        {/* Pinned tabs */}
        {pinnedTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const globalIdx = openTabs.findIndex(t => t.id === tab.id);
          return (
            <div
              key={tab.id}
              draggable
              onDragStart={(e) => handleDragStart(e, globalIdx)}
              onDragOver={(e) => handleDragOver(e, globalIdx)}
              onDrop={(e) => handleDrop(e, globalIdx)}
              className="flex items-center gap-1 px-2.5 py-1.5 cursor-pointer text-sm shrink-0 group"
              style={{
                backgroundColor: isActive ? currentTheme.editor : 'transparent',
                borderTop: isActive ? `2px solid ${currentTheme.accent}` : '2px solid transparent',
                borderRight: `1px solid ${currentTheme.border}`,
                color: isActive ? currentTheme.text : currentTheme.textMuted,
                opacity: dragOverIdx === globalIdx ? 0.5 : 1,
              }}
              onClick={() => setActiveTab(tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              title={tab.path}
            >
              <span className="text-xs">{getFileIcon(tab.name)}</span>
              <span className="text-xs">📌</span>
            </div>
          );
        })}

        {/* Separator if there are pinned tabs */}
        {pinnedTabs.length > 0 && unpinnedTabs.length > 0 && (
          <div className="w-[1px] h-6 mx-0.5" style={{ backgroundColor: currentTheme.border }} />
        )}

        {/* Regular tabs */}
        {unpinnedTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const globalIdx = openTabs.findIndex(t => t.id === tab.id);
          return (
            <div
              key={tab.id}
              draggable
              onDragStart={(e) => handleDragStart(e, globalIdx)}
              onDragOver={(e) => handleDragOver(e, globalIdx)}
              onDrop={(e) => handleDrop(e, globalIdx)}
              className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer text-sm border-r shrink-0 group"
              style={{
                backgroundColor: isActive ? currentTheme.editor : 'transparent',
                borderRightColor: currentTheme.border,
                borderTop: isActive ? `2px solid ${currentTheme.accent}` : '2px solid transparent',
                color: isActive ? currentTheme.text : currentTheme.textMuted,
                opacity: dragOverIdx === globalIdx ? 0.5 : 1,
              }}
              onClick={() => setActiveTab(tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              title={tab.path}
            >
              <span className="text-xs">{getFileIcon(tab.name)}</span>
              <span className="truncate max-w-[120px]">
                {tab.isModified && (
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: currentTheme.accent }} />
                )}
                {tab.name}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-xs ml-0.5 w-4 h-4 flex items-center justify-center rounded hover:bg-white/10"
                style={{ color: currentTheme.textMuted }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 py-1 rounded shadow-xl text-sm min-w-[200px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              backgroundColor: currentTheme.sidebar,
              border: `1px solid ${currentTheme.border}`,
              color: currentTheme.text,
            }}
          >
            <button
              className="w-full text-left px-3 py-1.5 hover:bg-white/10 text-xs"
              onClick={() => { closeTab(contextMenu.tabId); setContextMenu(null); }}
            >
              Close
            </button>
            <button
              className="w-full text-left px-3 py-1.5 hover:bg-white/10 text-xs"
              onClick={() => { closeOtherTabs(contextMenu.tabId); setContextMenu(null); }}
            >
              Close Others
            </button>
            <button
              className="w-full text-left px-3 py-1.5 hover:bg-white/10 text-xs"
              onClick={() => { closeTabsToRight(contextMenu.tabId); setContextMenu(null); }}
            >
              Close to the Right
            </button>
            <button
              className="w-full text-left px-3 py-1.5 hover:bg-white/10 text-xs"
              onClick={() => { closeAllTabs(); setContextMenu(null); }}
            >
              Close All
            </button>
            <div className="border-t my-1" style={{ borderColor: currentTheme.border }} />
            <button
              className="w-full text-left px-3 py-1.5 hover:bg-white/10 text-xs"
              onClick={() => { pinTab(contextMenu.tabId); setContextMenu(null); }}
            >
              {openTabs.find(t => t.id === contextMenu.tabId)?.isPinned ? '📌 Unpin Tab' : '📌 Pin Tab'}
            </button>
          </div>
        </>
      )}
    </>
  );
}
