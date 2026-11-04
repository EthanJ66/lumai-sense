import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { aiPlugin } from './server/ai';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), aiPlugin({apiKey: env.OPENAI_API_KEY || '', model: env.OPENAI_MODEL || 'gpt-4.1-mini'})],
    server: { host:'127.0.0.1' },
    preview: { host:'127.0.0.1' },
  };
});
