import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import VConsole from 'vconsole'

// 配置 axios 默认值
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''

// 直接初始化 vConsole，不判断环境
const vConsole = new VConsole()
console.log('[VConsole] 已初始化')

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.mount('#app')