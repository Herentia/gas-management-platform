// src/utils/request.ts (简化版本)
import axios from 'axios'
import { ElMessage } from 'element-plus'

const baseURL = import.meta.env.VITE_APP_BASE_API || '/api'

const request = axios.create({
  baseURL,
  timeout: 20000,
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers = config.headers || {};
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    let message = '网络错误'
    if (error.response?.status) {
      switch (error.response.status) {
        case 401:
          message = '未授权'
          break
        case 404:
          message = '接口不存在'
          break
        case 500:
          message = '服务器错误'
          break
        default:
          message = error.response.data?.message || '请求失败'
      }
    }
    ElMessage.error(message)
    return Promise.reject(error)
  },
)

export default request
