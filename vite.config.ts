import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 合并两个配置为一个
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',  // 确保 public 目录下的文件被复制到 dist
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});