import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  // base: 你的 GitHub 仓库名，末尾必须带 /
  // 例如仓库叫 "my-site" → base: '/my-site/'
  // 仓库叫 "-" → base: '/-/'
  base: '/-/',
  plugins: [react(), tailwindcss(), cloudflare()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})