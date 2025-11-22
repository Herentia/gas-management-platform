// src/api/user.ts
import request from '@/utils/request';

// 用户相关数据类型
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// 用户相关 API 方法
export const userApi = {
  hello() {
    return request.get('/hello');
  },
  // 用户登录
  login(data: LoginParams) {
    return request.post<LoginResponse>('/auth/login', data);
  },

  // 获取用户信息
  getUserInfo() {
    return request.get<User>('/user/info');
  },

  // 更新用户信息
  updateUserInfo(data: Partial<User>) {
    return request.put<User>('/user/info', data);
  },

  // 获取用户列表
  getUserList(params?: { page: number; size: number }) {
    return request.get<{ list: User[]; total: number }>('/user/list', { params });
  },

  // 删除用户
  deleteUser(id: number) {
    return request.delete(`/user/${id}`);
  }
};
