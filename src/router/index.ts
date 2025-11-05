import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import PipeNetworkView from '@/views/PipeNetworkView.vue'
import InspectionView from '@/views/InspectionView.vue'
import EngineeringView from '@/views/EngineeringView.vue'
import CustomerServiceView from '@/views/CustomerServiceView.vue'

// 路由类型定义 - 添加索引签名
export interface RouteMeta extends Record<string, unknown> {
  title: string
  requiresAuth?: boolean
  icon?: string
  breadcrumb?: string[]
}

// 路由配置
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      title: '首页 - 燃气智慧管理平台',
      icon: 'fa-home',
      breadcrumb: ['首页'],
    },
  },
  {
    path: '/pipe-network',
    name: 'pipe-network',
    component: PipeNetworkView,
    meta: {
      title: '管网管理 - 燃气智慧管理平台',
      requiresAuth: true,
      icon: 'fa-sitemap',
      breadcrumb: ['首页', '管网管理'],
    },
    // redirect: { name: 'gas-source' },
    // children: [
    //   {
    //     path: 'gasSourceFlowPressureDetection',
    //     name: 'gasSourceFlowPressureDetection',
    //     component: () =>
    //       import('@/components/pipe-network/GasSourceFlowPressureDetectionModule.vue'),
    //     meta: {
    //       title: '气源监测 - 管网管理',
    //       breadcrumb: ['首页', '管网管理', '气源流量压力监测'],
    //     },
    //   },
    //   {
    //     path: 'gas-source',
    //     name: 'gas-source',
    //     component: () => import('@/views/GasPipeControl/GasSourcePanel.vue'),
    //     meta: { title: '管网监控', icon: 'monitor' },
    //   },
    //   {
    //     path: 'end-point',
    //     name: 'end-point',
    //     component: () => import('@/components/pipe-network/EndPointModule.vue'),
    //     meta: {
    //       title: '末端监测 - 管网管理',
    //       breadcrumb: ['首页', '管网管理', '末端流量压力'],
    //     },
    //   },
    //   {
    //     path: 'distribution',
    //     name: 'distribution',
    //     component: () => import('@/components/pipe-network/PipeDistributionModule.vue'),
    //     meta: {
    //       title: '管网分布 - 管网管理',
    //       breadcrumb: ['首页', '管网管理', '管网分布'],
    //     },
    //   },
    //   {
    //     path: 'equipment',
    //     name: 'equipment',
    //     component: () => import('@/components/pipe-network/EquipmentModule.vue'),
    //     meta: {
    //       title: '设备设施 - 管网管理',
    //       breadcrumb: ['首页', '管网管理', '设备设施'],
    //     },
    //   },
    // ],
  },
  {
    path: '/inspection',
    name: 'inspection',
    component: InspectionView,
    meta: {
      title: '巡检管理 - 燃气智慧管理平台',
      requiresAuth: true,
      icon: 'fa-walking',
      breadcrumb: ['首页', '巡检管理'],
    },
  },
  {
    path: '/engineering',
    name: 'engineering',
    component: EngineeringView,
    meta: {
      title: '工程管理 - 燃气智慧管理平台',
      requiresAuth: true,
      icon: 'fa-building',
      breadcrumb: ['首页', '工程管理'],
    },
  },
  {
    path: '/customer-service',
    name: 'customer-service',
    component: CustomerServiceView,
    meta: {
      title: '客服管理 - 燃气智慧管理平台',
      requiresAuth: true,
      icon: 'fa-users',
      breadcrumb: ['首页', '客服管理'],
    },
  },
  // {
  //   path: '/login',
  //   name: 'login',
  //   component: () => import('@/views/LoginView.vue'),
  //   meta: {
  //     title: '登录 - 燃气智慧管理平台',
  //     requiresAuth: false
  //   }
  // },
  // {
  //   path: '/:pathMatch(.*)*',
  //   name: 'not-found',
  //   component: () => import('@/views/NotFoundView.vue'),
  //   meta: {
  //     title: '页面未找到 - 燃气智慧管理平台'
  //   }
  // }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置，则返回该位置
    if (savedPosition) {
      return savedPosition
    }
    // 否则滚动到顶部
    return { top: 0 }
  },
})

// 类型安全的元数据获取函数
function getRouteMeta(routeName: string): RouteMeta | null {
  const route = router.getRoutes().find((r) => r.name === routeName)
  return (route?.meta as unknown as RouteMeta) || null
}

// 类型守卫函数
function isRouteMeta(meta: unknown): meta is RouteMeta {
  return typeof meta === 'object' && meta !== null && 'title' in meta
}

// // 路由守卫 - 全局前置守卫
// router.beforeEach((to, from, next) => {
//   // 设置页面标题
//   if (to.meta && isRouteMeta(to.meta) && to.meta.title) {
//     document.title = to.meta.title
//   }

//   // 检查是否需要认证
//   if (to.meta && isRouteMeta(to.meta) && to.meta.requiresAuth) {
//     const isAuthenticated = checkAuth()

//     if (!isAuthenticated) {
//       // 如果未认证，重定向到登录页
//       next({
//         name: 'login',
//         query: { redirect: to.fullPath },
//       })
//       return
//     }
//   }

//   next()
// })

// 路由守卫 - 全局后置钩子
router.afterEach((to, from) => {
  // 可以在这里添加页面访问统计等逻辑
  console.log(`Navigated to: ${to.name?.toString()}`)
})

// 认证检查函数（示例）
function checkAuth(): boolean {
  // 这里实现您的认证逻辑
  const token = localStorage.getItem('auth_token')
  return !!token
}

// 导航辅助函数
export function navigateTo(routeName: string, params?: Record<string, any>) {
  router.push({ name: routeName, params })
}

export function replaceTo(routeName: string, params?: Record<string, any>) {
  router.replace({ name: routeName, params })
}

export function goBack() {
  router.go(-1)
}

// 获取当前路由信息
export function getCurrentRoute() {
  return router.currentRoute.value
}

export { getRouteMeta }
export default router
