<template>
  <Header />
  <div class="fade-in">
    <!-- 功能模块标题 -->
    <h2 class="responsive-heading mb-6 text-gray-800">功能模块</h2>

    <!-- 功能模块卡片网格 -->
    <div class="modules-grid">
      <ModuleCard v-for="moduleItem in modules" :key="moduleItem.id" :card-data="moduleItem"
        @click="navigateTo(moduleItem.targetView)" />
    </div>

    <!-- 系统概览 -->
    <SystemOverview />
  </div>
  <Footer />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Footer from '@/components/layout/Footer.vue'
import Header from '@/components/layout/Header.vue'
import ModuleCard from '@/components/dashboard/ModuleCard.vue'
import SystemOverview from '@/components/dashboard/SystemOverview.vue'
import type { ModuleCard as ModuleCardType, AlertItem } from '@/types'

const router = useRouter()

// 功能模块数据 - 使用 moduleItems 避免关键字冲突
const modules = ref<ModuleCardType[]>([
  {
    id: 'pipe-network-module',
    title: '管网管理',
    description: '实时监测管网运行状态，包括流量、压力等关键指标',
    status: 'warning',
    statusText: '异常',
    infoText: '调压箱压力异常（3处）',
    icon: 'fa-sitemap',
    targetView: 'pipe-network'
  },
  {
    id: 'inspection-module',
    title: '巡检管理',
    description: '管理市政管网、庭院管网巡检及入户安检任务',
    status: 'normal',
    statusText: '正常',
    infoText: '今日巡检任务已完成80%',
    icon: 'fa-walking',
    targetView: 'inspection'
  },
  {
    id: 'engineering-module',
    title: '工程管理',
    description: '负责应急抢险和工程建设的全流程管理',
    status: 'warning',
    statusText: '异常',
    infoText: '2项工程建设已逾期',
    icon: 'fa-building',
    targetView: 'engineering'
  },
  {
    id: 'customer-service-module',
    title: '客服管理',
    description: '处理用户咨询、查询用户信息及管理服务请求',
    status: 'normal',
    statusText: '正常',
    infoText: '当前无未处理客服请求',
    icon: 'fa-users',
    targetView: 'customer-service'
  }
])

// 最近告警数据
const recentAlerts = ref<AlertItem[]>([
  {
    type: 'danger',
    title: '调压箱压力过高',
    location: '城东片区',
    time: '10:23'
  },
  {
    type: 'warning',
    title: '工程进度滞后',
    location: '南部新区管网',
    time: '09:15'
  },
  {
    type: 'danger',
    title: '流量计异常',
    location: '工业园区',
    time: '08:47'
  }
])

// 导航到指定页面
const navigateTo = (view: string) => {
  router.push({ name: view })
}
</script>

<style scoped>
/* 网格布局 */
.modules-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

@media (min-width: 768px) {
  .modules-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .modules-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 响应式标题 */
.responsive-heading {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #1F2937;
}

/* 文本颜色 */
.text-gray-800 {
  color: #1F2937;
}

/* 间距 */
.mb-6 {
  margin-bottom: 1.5rem;
}
</style>
