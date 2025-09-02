import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as Icons from '@element-plus/icons-vue'

import Chart from 'chart.js/auto'

const app = createApp(App)

// 全局注册所有 Element Plus 图标
for (const [key, component] of Object.entries(Icons)) {
  app.component(key, component)
}

app.use(ElementPlus)

app.use(createPinia())
app.use(router)

app.mount('#app')
