// src/utils/request.ts
import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { ElMessage } from 'element-plus' // 可选，用于统一消息提示

// 创建一个 axios 实例
const request: AxiosInstance = axios.create({
  // 根据环境设置 baseURL，可以从 .env 文件中的环境变量读取
  // baseURL: import.meta.env.VITE_APP_BASE_API,
  baseURL: '/api', // 开发阶段，匹配我们在 vite.config.ts 中设置的代理前缀
  timeout: 20000, // 请求超时时间
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么，例如添加 token 到请求头
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers['Authorization'] = `Bearer ${token}`;
    // }
    return config
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error)
  },
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么，例如根据自定义 code 进行特定处理
    const res = response.data
    // 假设我们的业务代码 20000 代表成功
    if (res.code === 20000) {
      return res
    } else {
      // 处理业务错误（非HTTP状态码错误）
      ElMessage.error(res.message || 'Request Failed')
      return Promise.reject(new Error(res.message || 'Request Failed'))
    }
  },
  (error) => {
    // 对响应错误做点什么，处理 HTTP 网络错误
    const { message } = error
    if (message.indexOf('timeout') != -1) {
      ElMessage.error('网络超时！')
    } else if (message == 'Network Error') {
      ElMessage.error('网络连接错误！')
    } else {
      ElMessage.error(error.message || 'Network Error')
    }
    return Promise.reject(error)
  },
)

export default request
