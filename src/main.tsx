import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

const HavenIDE = lazy(() => import('./ide/HavenIDE'));

/** Detect if we're on the ide.* subdomain */
const isIDESubdomain = window.location.hostname.startsWith('ide.');

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
    <BrowserRouter>
      <Routes>
        {isIDESubdomain ? (
          <>
            {/* ide.khawrizm.com — everything goes to the IDE */}
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
    </BrowserRouter>
  </StrictMode>,
);
