import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the Worlddashboard project.
export default defineConfig({
  plugins: [react()],
  // GitHub Pages用のベースパス（リポジトリ名）を必ず指定します
  base: '/worlddashboard_3/',
  server: {
    port: 5173,
  },
});
