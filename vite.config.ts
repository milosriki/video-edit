import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

// FIX: Define __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  // IMPORTANT: REPLACE THIS WITH YOUR FIREBASE PROJECT ID
  const firebaseProjectId = 'ptd-fitness-demo';
  
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        // This now points to the Firebase Functions emulator
        '/api': {
          target: `http://127.0.0.1:5001/${firebaseProjectId}/us-central1/api`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});