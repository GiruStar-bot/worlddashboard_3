import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages デプロイ用の設定
export default defineConfig({
  plugins: [react()],
  // 重要: リポジトリ名に合わせてベースパスを設定
  // これにより、/worlddashboard_3/assets/... という正しいパスでファイルを読み込みます
  base: '/worlddashboard_3/', 
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // ブラウザでのJSX実行エラーを避けるため、ビルドを安定させます
    sourcemap: false,
  }
});
