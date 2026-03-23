import React, { useState } from 'react';
import { useIDEStore } from '../useIDEStore';

export function SettingsEditor() {
  const { settings, updateSetting, currentTheme } = useIDEStore();
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [...new Set(settings.map(s => s.category))];
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = settings.filter(s => {
    const matchesSearch = !searchTerm ||
      s.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !activeCategory || s.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: currentTheme.editor }}>
      {/* Header */}
      <div className="px-6 py-4 border-b" style={{ borderColor: currentTheme.border }}>
        <h2 className="text-lg font-semibold mb-3" style={{ color: currentTheme.text }}>Settings</h2>
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search settings..."
          className="w-full bg-transparent border rounded px-3 py-1.5 text-sm outline-none"
          style={{ borderColor: currentTheme.border, color: currentTheme.text }}
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setActiveCategory(null)}
            className="text-xs px-2.5 py-1 rounded transition-colors"
            style={{
              backgroundColor: !activeCategory ? currentTheme.accent + '20' : 'transparent',
              color: !activeCategory ? currentTheme.accent : currentTheme.textMuted,
              border: `1px solid ${!activeCategory ? currentTheme.accent + '40' : currentTheme.border}`,
            }}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className="text-xs px-2.5 py-1 rounded transition-colors"
              style={{
                backgroundColor: activeCategory === cat ? currentTheme.accent + '20' : 'transparent',
                color: activeCategory === cat ? currentTheme.accent : currentTheme.textMuted,
                border: `1px solid ${activeCategory === cat ? currentTheme.accent + '40' : currentTheme.border}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Settings list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {filtered.map(setting => (
          <div key={setting.id} className="py-3 border-b" style={{ borderColor: currentTheme.border + '60' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: currentTheme.text }}>{setting.label}</div>
                <div className="text-xs mt-0.5" style={{ color: currentTheme.textMuted }}>{setting.description}</div>
                <div className="text-xs mt-0.5 opacity-40 font-mono" style={{ color: currentTheme.textMuted }}>{setting.id}</div>
              </div>
              <div className="shrink-0">
                {setting.type === 'boolean' && (
                  <button
                    onClick={() => updateSetting(setting.id, !setting.value)}
                    className="relative w-10 h-5 rounded-full transition-colors"
                    style={{ backgroundColor: setting.value ? currentTheme.accent + '40' : currentTheme.border }}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
                      style={{
                        backgroundColor: setting.value ? currentTheme.accent : currentTheme.textMuted,
                        left: setting.value ? '22px' : '2px',
                      }}
                    />
                  </button>
                )}
                {setting.type === 'number' && (
                  <input
                    type="number"
                    value={setting.value as number}
                    onChange={(e) => updateSetting(setting.id, parseInt(e.target.value) || 0)}
                    className="w-20 bg-transparent border rounded px-2 py-0.5 text-sm outline-none text-center"
                    style={{ borderColor: currentTheme.border, color: currentTheme.text }}
                  />
                )}
                {setting.type === 'string' && (
                  <input
                    value={setting.value as string}
                    onChange={(e) => updateSetting(setting.id, e.target.value)}
                    className="w-40 bg-transparent border rounded px-2 py-0.5 text-sm outline-none"
                    style={{ borderColor: currentTheme.border, color: currentTheme.text }}
                  />
                )}
                {setting.type === 'select' && setting.options && (
                  <select
                    value={setting.value as string}
                    onChange={(e) => updateSetting(setting.id, e.target.value)}
                    className="bg-transparent border rounded px-2 py-0.5 text-sm outline-none cursor-pointer"
                    style={{ borderColor: currentTheme.border, color: currentTheme.text, backgroundColor: currentTheme.bg }}
                  >
                    {setting.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
