
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5174,
      strictPort: false,
      // Force browser to never use cached JS/HTML so edits always show at 127.0.0.1:5173
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY),
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
