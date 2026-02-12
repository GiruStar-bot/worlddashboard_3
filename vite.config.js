import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for Worlddashboard.
// base プロパティをリポジトリ名に合わせることで、GitHub Pages上でのパス解決を正常化します。
export default defineConfig({
  plugins: [react()],
  base: '/worlddashboard_3/', 
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  }
});
