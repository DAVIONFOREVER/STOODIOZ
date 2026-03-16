
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [
      // Must run first so we handle create-wallet-checkout before the proxy forwards to Supabase
      {
        name: 'local-create-wallet-checkout',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.method === 'OPTIONS' && req.url?.includes('create-wallet-checkout')) {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
              res.statusCode = 204;
              res.end();
              return;
            }
            if (req.method !== 'POST' || !req.url?.includes('/supabase-functions/create-wallet-checkout')) {
              next();
              return;
            }
            const chunks = [];
            req.on('data', (chunk) => chunks.push(chunk));
            req.on('end', async () => {
              try {
                const bodyStr = Buffer.concat(chunks).toString('utf8');
                const { handleCreateWalletCheckout } = await import('./server/create-wallet-checkout-handler.mjs');
                const { status, body } = await handleCreateWalletCheckout(bodyStr, env);
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.statusCode = status;
                res.end(body);
              } catch (e) {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.statusCode = 500;
                res.end(JSON.stringify({ error: (e && e.message) || String(e) }));
              }
            });
            req.on('error', () => {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Request error' }));
            });
          });
        },
      },
      react(),
    ],
    server: {
      host: '127.0.0.1',
      port: 5174,
      strictPort: true,
      force: true, // re-run dependency pre-bundle when deps change so edits sync
      // Force browser to never use cached JS/HTML so edits always show
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
      // Proxy wallet checkout to Supabase so browser hits same-origin (avoids CORS when gateway blocks OPTIONS)
      proxy: {
        '/supabase-functions': {
          target: env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://ijcxeispefnbfwiviyux.supabase.co',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/supabase-functions/, '/functions/v1'),
        },
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY)
    },
    build: {
      rollupOptions: {
        external: ['xlsx'],
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'react';
              if (id.includes('@supabase')) return 'supabase';
              if (id.includes('firebase')) return 'firebase';
              if (id.includes('stripe')) return 'stripe';
              if (id.includes('three')) return 'three';
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
