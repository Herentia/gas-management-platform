// src/api/index.ts
import { userApi } from './user';
import { zzrqApi } from './zzrq';
// import { productApi } from './product';
// import { orderApi } from './order';

// 统一导出所有 API
export const api = {
  ...userApi,
  ...zzrqApi,
  // ...productApi,
  // ...orderApi,
};

// 也可以按模块导出（推荐这种方式，更清晰）
export const apiModules = {
  user: userApi,
  zzrq: zzrqApi,
  // product: productApi,
  // order: orderApi,
};

// 导出类型
export * from './user';
export * from './zzrq';
// export * from './product';
// export * from './order';

// 默认导出
export default api;
