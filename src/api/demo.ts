// src/api/demo.ts
import request from '@/utils/request'

// 示例：获取数据
export function fetchDemoData(params?: any) {
  return request({
    url: '/hello', // 实际请求 /api/test (由代理处理)
    method: 'GET',
    params: params, // GET 查询参数
  })
}

// 示例：提交数据
export function postDemoData(data: any) {
  return request({
    url: '/submit',
    method: 'POST',
    data: data, // POST 请求体数据
  })
}
