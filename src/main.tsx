import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isTauri } from '@tauri-apps/api/core';
import App from './App.tsx';
import './index.css';

const HavenIDE = lazy(() => import('./ide/HavenIDE'));

/** Detect if we're on the ide.* subdomain */
const isIDESubdomain = window.location.hostname.startsWith('ide.');
const isDesktopShell = isTauri();
const isElectronShell = typeof window !== 'undefined' && 'electronAPI' in window;
const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';
const shouldLaunchIDE = isIDESubdomain || isDesktopShell || isElectronShell;
const Router = isFileProtocol ? HashRouter : BrowserRouter;

if ((isDesktopShell || isElectronShell) && typeof window !== 'undefined') {
  void navigator.serviceWorker?.getRegistrations?.().then((registrations) => {
    registrations.forEach((registration) => {
      void registration.unregister();
    });
  }).catch(() => {});

  void caches?.keys?.().then((cacheNames) => {
    cacheNames.forEach((cacheName) => {
      void caches.delete(cacheName);
    });
  }).catch(() => {});
}

function LoadingScreen() {
  return (
    <div className="h-screen w-screen bg-haven-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-4xl animate-pulse">⚡</div>
        <p className="text-neon-green font-mono text-sm animate-pulse">Loading HAVEN IDE...</p>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        {shouldLaunchIDE ? (
          <>
            {/* Desktop shells and ide.* domain — everything goes straight to the IDE */}
            <Route
              path="*"
              element={
                <Suspense fallback={<LoadingScreen />}>
                  <HavenIDE />
                </Suspense>
              }
            />
          </>
        ) : (
          <>
            {/* Main domain — landing + /ide path */}
            <Route path="/" element={<App />} />
            <Route
              path="/ide"
              element={
                <Suspense fallback={<LoadingScreen />}>
                  <HavenIDE />
                </Suspense>
              }
            />
          </>
        )}
      </Routes>
    </Router>
  </StrictMode>,
);
