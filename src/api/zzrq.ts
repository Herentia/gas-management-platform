// 崇州燃气 API 接口
// src/api/user.ts
import request from '@/utils/request';

// // 用户相关数据类型
// export interface User {
//   id: number;
//   name: string;
//   email: string;
//   avatar?: string;
// }

// 用户相关 API 方法
export const zzrqApi = {
  // 测试接口
  hello() {
    return request.get('/hello');
  },
  // 获取点图形数据
  getPntByArea(params?: { minLng: number; minLat: number; maxLng: number; maxLat: number }) {
    return request.get<any>('/pnt/by-bounds', { params });
  },
  // 获取线图形数据
  getLinByArea(params?: { minLng: number; minLat: number; maxLng: number; maxLat: number }) {
    return request.get<any>('/lin/by-bounds', { params });
  }
  // // 用户登录
  // login(data: LoginParams) {
  //   return request.post<LoginResponse>('/auth/login', data);
  // },

  // // 获取用户信息
  // getUserInfo() {
  //   return request.get<User>('/user/info');
  // },

  // // 更新用户信息
  // updateUserInfo(data: Partial<User>) {
  //   return request.put<User>('/user/info', data);
  // },

  // // 获取用户列表
  // getUserList(params?: { page: number; size: number }) {
  //   return request.get<{ list: User[]; total: number }>('/user/list', { params });
  // },

  // // 删除用户
  // deleteUser(id: number) {
  //   return request.delete(`/user/${id}`);
  // }
};
