<template>
  <!-- 动态组件容器 -->
  <component :is="currentComponent" v-if="currentComponent && isVisible" :key="panelKey" @close="closePanel"
    @minimize="minimizePanel" />

  <!-- 最小化面板图标 -->
  <div v-if="minimizedPanels.length > 0" class="minimized-panels-container">
    <div v-for="panel in minimizedPanels" :key="panel.type" class="minimized-panel-icon"
      @click="restorePanel(panel.type)" :title="panel.title">
      <el-icon :size="20">
        <component :is="panel.icon" />
      </el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef, markRaw, type Component } from 'vue'
import { useRoute } from 'vue-router'
import {
  List,
  DataAnalysis,
  Monitor,
  Warning,
  HomeFilled
} from '@element-plus/icons-vue'

// 导入各个面板组件
import GasSourcePanel from './GasSourcePanel.vue'
// import GasUsagePanel from './GasUsagePanel.vue'
// import AlertAnalysisPanel from './AlertAnalysisPanel.vue'

interface PanelConfig {
  type: string
  component: Component
  icon: Component
  title: string
  position: string
}

interface MinimizedPanel {
  type: string
  icon: Component
  title: string
}

// 使用 markRaw 包装组件，避免响应式
const panelConfigs: Record<string, PanelConfig> = {
  'pipe-network': {
    type: 'pipe-network',
    component: markRaw(GasSourcePanel),
    icon: markRaw(List),
    title: '气源管理',
    position: 'left'
  },
  // 'gas-usage': {
  //   type: 'gas-usage',
  //   component: markRaw(GasUsagePanel),
  //   icon: markRaw(DataAnalysis),
  //   title: '用气统计',
  //   position: 'right'
  // },
  // 'alert-analysis': {
  //   type: 'alert-analysis',
  //   component: markRaw(AlertAnalysisPanel),
  //   icon: markRaw(Warning),
  //   title: '报警分析',
  //   position: 'left'
  // }
}

// 路由到面板类型的映射
const routeToPanelMap: Record<string, string> = {
  '/monitor/pipe-network': 'pipe-network',
  '/data-analysis/usage': 'gas-usage',
  '/data-analysis/alerts': 'alert-analysis',
  '/': 'home'
}

const route = useRoute()
const isVisible = ref(false)
const minimizedPanels = ref<MinimizedPanel[]>([])
const panelKey = ref(0)

// 使用 shallowRef 替代 ref 来存储组件
const currentComponent = shallowRef<Component | null>(null)

const currentPanelType = computed(() => {
  return routeToPanelMap[route.path] || null
})

// 监听路由变化
watch(() => route.path, (newPath) => {
  const panelType = routeToPanelMap[newPath]

  if (panelType === 'home') {
    isVisible.value = false
    currentComponent.value = null
    return
  }

  if (panelType && panelConfigs[panelType]) {
    const config = panelConfigs[panelType]

    // 如果面板已经最小化，则恢复它
    const minimizedIndex = minimizedPanels.value.findIndex(p => p.type === panelType)
    if (minimizedIndex !== -1) {
      minimizedPanels.value.splice(minimizedIndex, 1)
    }

    currentComponent.value = config.component
    isVisible.value = true
    panelKey.value++
  } else {
    isVisible.value = false
    currentComponent.value = null
  }
}, { immediate: true })

// 关闭面板
const closePanel = () => {
  isVisible.value = false
  currentComponent.value = null
}

// 最小化面板
const minimizePanel = () => {
  if (currentPanelType.value && panelConfigs[currentPanelType.value]) {
    const config = panelConfigs[currentPanelType.value]
    minimizedPanels.value.push({
      type: currentPanelType.value,
      icon: config.icon,
      title: config.title
    })
    isVisible.value = false
    currentComponent.value = null
  }
}

// 恢复面板
const restorePanel = (panelType: string) => {
  const index = minimizedPanels.value.findIndex(p => p.type === panelType)
  if (index !== -1) {
    minimizedPanels.value.splice(index, 1)

    if (panelConfigs[panelType]) {
      currentComponent.value = panelConfigs[panelType].component
      isVisible.value = true
      panelKey.value++
    }
  }
}
</script>

<style scoped>
/* 样式保持不变 */
.minimized-panels-container {
  position: absolute;
  left: 20px;
  bottom: 20px;
  z-index: 998;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.minimized-panel-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #165DFF;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.minimized-panel-icon:hover {
  background: #0e42d2;
  transform: scale(1.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .minimized-panels-container {
    left: 10px;
    bottom: 10px;
  }

  .minimized-panel-icon {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 480px) {
  .minimized-panels-container {
    left: 8px;
    bottom: 8px;
  }

  .minimized-panel-icon {
    width: 32px;
    height: 32px;
  }
}
</style>
