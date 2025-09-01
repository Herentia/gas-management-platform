import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PipeNetworkView from '../views/PipeNetworkView.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/pipe-network',
    name: 'PipeNetwork',
    component: PipeNetworkView,
    children: [
      {
        path: 'gas-source',
        name: 'GasSource',
        component: () => import('../views/pipe-network/GasSourceModule.vue'),
      },
      {
        path: 'end-point',
        name: 'EndPoint',
        component: () => import('../views/pipe-network/EndPointModule.vue'),
      },
      {
        path: 'pipe-distribution',
        name: 'PipeDistribution',
        component: () => import('../views/pipe-network/PipeDistributionModule.vue'),
      },
      {
        path: 'equipment',
        name: 'Equipment',
        component: () => import('../views/pipe-network/EquipmentModule.vue'),
      },
      {
        path: '',
        redirect: 'gas-source',
      },
    ],
  },
  {
    path: '/inspection',
    name: 'Inspection',
    component: () => import('../views/InspectionView.vue'),
  },
  {
    path: '/engineering',
    name: 'Engineering',
    component: () => import('../views/EngineeringView.vue'),
  },
  {
    path: '/customer-service',
    name: 'CustomerService',
    component: () => import('../views/CustomerServiceView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
