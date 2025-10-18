import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This configuration is based on the user's instructions to proxy API calls
// during local development to the Supabase emulator.

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/supabase': {
        target: 'http://localhost:54321',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/supabase/, ''),
      },
      '/api/aria': {
        target: 'http://localhost:54321/functions/v1/aria',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/aria/, ''),
      },
      '/api/stripe': {
        target: 'http://localhost:54321/functions/v1/stripe',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/stripe/, ''),
      }
    }
  }
});
