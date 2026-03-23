import { useIDEStore } from '../useIDEStore';

export function NotificationCenter() {
  const { notifications, dismissNotification, currentTheme } = useIDEStore();

  if (notifications.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      default: return '📢';
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'info': return '#60a5fa';
      case 'warning': return '#fbbf24';
      case 'error': return '#ef4444';
      case 'success': return currentTheme.accent;
      default: return currentTheme.border;
    }
  };

  return (
    <div className="fixed bottom-10 right-4 z-50 flex flex-col gap-2 max-w-[380px]">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="flex items-start gap-3 px-4 py-3 rounded-lg shadow-2xl animate-slide-in"
          style={{
            backgroundColor: currentTheme.sidebar,
            border: `1px solid ${getBorderColor(notif.type)}`,
            borderLeft: `3px solid ${getBorderColor(notif.type)}`,
            color: currentTheme.text,
          }}
        >
          <span className="text-base shrink-0 mt-0.5">{getIcon(notif.type)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-snug">{notif.message}</p>
            {notif.detail && (
              <p className="text-xs mt-1 opacity-60">{notif.detail}</p>
            )}
            {notif.actions && notif.actions.length > 0 && (
              <div className="flex gap-2 mt-2">
                {notif.actions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => { action.action(); dismissNotification(notif.id); }}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: currentTheme.accent + '20', color: currentTheme.accent }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => dismissNotification(notif.id)}
            className="text-xs opacity-40 hover:opacity-100 shrink-0"
            style={{ color: currentTheme.textMuted }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
