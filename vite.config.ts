import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This configuration is for local development with Vite.
// For Vercel deployment, environment variables are used directly.
export default defineConfig({
  plugins: [react()],
});
