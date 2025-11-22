import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 正确的加载环境变量方式
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    // 服务器代理配置
    server: {
      cors: true,
      port: 8889, // 开发服务器端口
      open: false, // 是否自动打开浏览器
      proxy: {
        // 代理以 '/api' 开头的请求
        '^/api': {
          target: env.VITE_APP_BASE_API || 'http://localhost:3000', // 使用环境变量，提供默认值
          changeOrigin: true, // 允许跨域
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''), // 重写路径，移除 '/api'
        },
      },
    },
  }
})
