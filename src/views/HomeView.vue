<template>
  <Header />
  <div class="dashboard-container">
    <!-- 顶部概览区域 -->
    <div class="overview-section">
      <div class="welcome-card">
        <div class="welcome-header">
          <!-- <h1>燃气管理系统</h1> -->
          <p>欢迎回来！以下是系统当前状态概览</p>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">12</span>
            <span class="stat-label">今日巡检任务</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">3</span>
            <span class="stat-label">异常设备</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">5</span>
            <span class="stat-label">待处理请求</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能模块标题 -->
    <h2 class="responsive-heading text-gray-800">功能模块</h2>

    <!-- 功能模块卡片网格 -->
    <div class="modules-grid">
      <ModuleCard v-for="moduleItem in modules" :key="moduleItem.id" :card-data="moduleItem"
        @click="navigateTo(moduleItem)" />
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
    targetView: 'pipe-network',
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

// 导航到指定页面，传递菜单类型
const navigateTo = (moduleItem: ModuleCardType) => {
  router.push({
    name: 'pipe-network',
    query: {
      menuType: moduleItem.targetView
    }
  })
}
</script>

<style scoped>
/* 主容器 - 进一步减少高度和内边距 */
.dashboard-container {
  /* min-height: calc(100vh - 90px); */
  /* 进一步减少高度估算 */
  padding: 0.75rem;
  /* 进一步减少内边距 */
  display: flex;
  flex-direction: column;
  gap: 1rem;
  /* 进一步减少间距 */
}

/* 顶部概览区域 - 单列布局 */
.overview-section {
  display: block;
  /* 改为单列布局 */
}

/* 欢迎卡片 - 进一步减少高度 */
.welcome-card {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border-radius: 8px;
  /* 进一步减小圆角 */
  padding: 1rem;
  /* 进一步减少内边距 */
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  /* 进一步减小阴影 */
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  /* 内部元素间距 */
}

.welcome-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  /* 标题和描述之间的间距 */
}

.welcome-card h1 {
  font-size: 1.25rem;
  /* 进一步减小字体大小 */
  font-weight: 700;
  margin: 0;
  /* 移除默认边距 */
}

.welcome-card p {
  opacity: 0.9;
  margin: 0;
  /* 移除默认边距 */
  font-size: 0.8rem;
  /* 进一步减小字体大小 */
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  /* 进一步减少间距 */
}

.stat-item {
  text-align: center;
  padding: 0.5rem;
  /* 进一步减少内边距 */
  background: rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: auto;
  /* 移除最小高度限制 */
}

.stat-value {
  font-size: 1.2rem;
  /* 进一步减小字体大小 */
  font-weight: 700;
  margin-bottom: 0.15rem;
  /* 进一步减少间距 */
  line-height: 1.2;
}

.stat-label {
  font-size: 0.7rem;
  /* 进一步减小字体大小 */
  opacity: 0.9;
  line-height: 1.2;
}

/* 网格布局 - 进一步减少间距 */
.modules-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  /* 进一步减少间距 */
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

/* 响应式标题 - 进一步减小字体大小 */
.responsive-heading {
  font-size: clamp(1.2rem, 2vw, 1.5rem);
  /* 进一步减小字体大小范围 */
  font-weight: 700;
  color: #1F2937;
  margin: 0;
  /* 移除默认边距 */
  padding: 0.5rem 0;
  /* 减少内边距 */
}

/* 文本颜色 */
.text-gray-800 {
  color: #1F2937;
}

/* 为ModuleCard组件添加更紧凑样式 */
:deep(.module-card) {
  padding: 0.75rem !important;
  /* 进一步减少内边距 */
  min-height: auto !important;
  /* 移除最小高度限制 */
}

:deep(.card-header) {
  margin-bottom: 0.5rem !important;
  /* 进一步减少底部间距 */
}

:deep(.card-title) {
  font-size: 1rem !important;
  /* 进一步减小字体大小 */
}

:deep(.card-description) {
  font-size: 0.8rem !important;
  /* 进一步减小字体大小 */
  margin-bottom: 0.5rem !important;
  /* 进一步减少底部间距 */
  line-height: 1.3 !important;
  /* 调整行高 */
}

:deep(.status-badge) {
  padding: 0.15rem 0.5rem !important;
  /* 进一步减少内边距 */
  font-size: 0.7rem !important;
  /* 进一步减小字体大小 */
}

:deep(.info-text) {
  font-size: 0.75rem !important;
  /* 进一步减小字体大小 */
}

/* 为SystemOverview组件添加更紧凑样式 */
:deep(.system-overview) {
  padding: 1rem !important;
  /* 进一步减少内边距 */
}

:deep(.overview-grid) {
  gap: 0.5rem !important;
  /* 进一步减少间距 */
}

:deep(.overview-item) {
  padding: 0.5rem !important;
  /* 进一步减少内边距 */
  min-height: auto !important;
  /* 移除最小高度限制 */
}

:deep(.overview-value) {
  font-size: 1.2rem !important;
  /* 进一步减小字体大小 */
  margin-bottom: 0.25rem !important;
  /* 减少间距 */
}

:deep(.overview-label) {
  font-size: 0.7rem !important;
  /* 进一步减小字体大小 */
}
</style>
