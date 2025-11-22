// src/api/index.ts
import { userApi } from './user';
// import { productApi } from './product';
// import { orderApi } from './order';

// 统一导出所有 API
export const api = {
  ...userApi,
  // ...productApi,
  // ...orderApi,
};

// 也可以按模块导出（推荐这种方式，更清晰）
export const apiModules = {
  user: userApi,
  // product: productApi,
  // order: orderApi,
};

// 导出类型
export * from './user';
// export * from './product';
// export * from './order';

// 默认导出
export default api;
