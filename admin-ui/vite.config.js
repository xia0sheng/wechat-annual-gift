import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [vue()],
    base: '/admin/',
    server: {
      proxy: {
        '/users': {
          target: 'https://wx.thunis.com',
          changeOrigin: true,
        }
      }
    },
    define: {
      'process.env': env
    }
  }
}) 