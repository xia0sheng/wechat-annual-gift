import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/admin/',
  server: {
    proxy: {
      '/users': {
        target: 'https://wx.thunis.com',
        changeOrigin: true,
      }
    }
  }
}) 