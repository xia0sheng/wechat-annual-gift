import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import VConsole from 'vconsole'

// 配置 axios 默认值
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''

// 在开发环境中初始化 vConsole
if (import.meta.env.DEV) {
  new VConsole({ theme: 'dark' })
  console.log('[VConsole] 已初始化')
}

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.mount('#app')