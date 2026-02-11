import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub PagesのURLパスに合わせて 'base' を設定します。
// https://<username>.github.io/<repository-name>/ の場合、
// base は '/<repository-name>/' になります。

export default defineConfig({
  plugins: [react()],
  base: '/worlddashboard_3/', // 追加：リポジトリ名に合わせる
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  }
});
