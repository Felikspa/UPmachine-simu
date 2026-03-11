import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: true,
    host: '0.0.0.0',
    // 增加大文件支持
    hmr: {
      overlay: false
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    // 增加资源大小限制
    chunkSizeWarningLimit: 50000
  },
  // 优化依赖预构建
  optimizeDeps: {
    exclude: ['three']
  }
});
