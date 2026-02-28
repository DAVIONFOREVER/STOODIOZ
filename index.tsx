import React from 'react';
import ReactDOM from 'react-dom/client';
import Hotfix from 'hotfix-error-handler';
import App from './App.tsx';
import { AppProvider } from './contexts/AppContext.tsx';
import './input.css';
import { DB_TIMEOUT_MS, HYDRATE_TIMEOUT_MS, AUTH_HYDRATE_WRAPPER_MS } from './constants';

// Verify env at runtime (Supabase: if either undefined, fix .env.local and restart dev server)
if (typeof window !== 'undefined') {
  const e = import.meta.env;
  console.log('[ENV]', e?.VITE_SUPABASE_URL, e?.VITE_SUPABASE_ANON_KEY?.slice(0, 6));
  (window as any).__supabaseEnvCheck = {
    VITE_SUPABASE_URL: e?.VITE_SUPABASE_URL ? 'SET' : 'MISSING',
    VITE_SUPABASE_ANON_KEY: e?.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
  };
  // Single place to confirm which timeout bundle is running. If errors still say "18000ms", the browser is using an old cached bundle.
  const ok = DB_TIMEOUT_MS >= 35000 && HYDRATE_TIMEOUT_MS >= 30000;
  (window as any).__stoodiozTimeouts = { DB_TIMEOUT_MS, HYDRATE_TIMEOUT_MS, AUTH_HYDRATE_WRAPPER_MS };
  if (!ok) {
    console.error('[STOODIOZ] OLD TIMEOUTS LOADED:', { DB_TIMEOUT_MS, HYDRATE_TIMEOUT_MS, AUTH_HYDRATE_WRAPPER_MS }, '— do a hard refresh (Ctrl+Shift+R / Cmd+Shift+R) and restart dev server.');
  } else {
    console.warn('[STOODIOZ] Runtime timeouts: DB=', DB_TIMEOUT_MS, 'Hydrate=', HYDRATE_TIMEOUT_MS, 'AuthWrapper=', AUTH_HYDRATE_WRAPPER_MS, '— if you still see "18000ms" in errors, hard refresh + restart dev server.');
  }
}

const hotfixApiKey = import.meta.env.VITE_HOTFIX_API_KEY;
const hotfixRepo = import.meta.env.VITE_HOTFIX_REPO || 'stoodioz-app';
if (hotfixApiKey) {
  Hotfix.init({ apiKey: hotfixApiKey, repo: hotfixRepo });
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(e: unknown) {
    console.error('[RootErrorBoundary]', e);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: '#fef3c7', color: '#1f2937', padding: 24, fontFamily: 'system-ui, sans-serif', textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ marginBottom: 16, color: '#4b5563' }}>The app hit an error. Try refreshing.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', background: '#f97316', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </RootErrorBoundary>
  </React.StrictMode>
);