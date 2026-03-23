import { useIDEStore } from '../useIDEStore';

export function Breadcrumbs() {
  const { breadcrumbs, currentTheme } = useIDEStore();

  if (breadcrumbs.length === 0) return null;

  return (
    <div
      className="flex items-center gap-1 px-4 py-1 text-xs overflow-x-auto"
      style={{ backgroundColor: currentTheme.editor, borderBottom: `1px solid ${currentTheme.border}`, color: currentTheme.textMuted }}
    >
      {breadcrumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1 shrink-0">
          {i > 0 && <span className="opacity-40 mx-0.5">›</span>}
          <span className="hover:opacity-100 cursor-pointer transition-opacity" style={{ opacity: i === breadcrumbs.length - 1 ? 1 : 0.6, color: i === breadcrumbs.length - 1 ? currentTheme.text : currentTheme.textMuted }}>
            {crumb}
          </span>
        </span>
      ))}
    </div>
  );
}
