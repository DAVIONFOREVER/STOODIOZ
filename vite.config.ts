// FIX: Add a triple-slash directive to include Node.js types, making `process.cwd()` available to TypeScript.
/// <reference types="node" />

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Expose the user's environment variable to the client code, as requested.
      'process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY': JSON.stringify(env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
      // Also define other process.env variables used in the app to prevent runtime errors.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    }
  }
});