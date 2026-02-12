import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pagesで真っ白にならないための必須設定（リポジトリ名を指定）
  base: '/worlddashboard_3/',
  server: {
    port: 5173,
  },
});
