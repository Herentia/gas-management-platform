<template>
  <transition name="slide-fade">
    <div v-if="visible" class="gas-source-panel" :class="[{ minimized: isMinimized }, position]">
      <!-- 正常状态 -->
      <div v-if="!isMinimized" class="panel-content">
        <div class="panel-header">
          <h3>气源管理</h3>
          <div class="header-actions">
            <el-tooltip content="最小化" placement="top">
              <el-button :icon="Minus" circle size="small" @click="minimizePanel" />
            </el-tooltip>
            <el-tooltip content="关闭" placement="top">
              <el-button :icon="Close" circle size="small" @click="closePanel" />
            </el-tooltip>
          </div>
        </div>

        <div class="panel-body">
          <!-- 搜索区域 -->
          <div class="search-section">
            <el-input v-model="searchKeyword" placeholder="请输入关键词" clearable @clear="handleSearch"
              @keyup.enter="handleSearch">
              <template #prefix>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>
          </div>

          <!-- 状态筛选 -->
          <div class="filter-section">
            <el-radio-group v-model="activeFilter" @change="handleFilterChange">
              <el-radio-button label="all">全部(6)</el-radio-button>
              <el-radio-button label="normal">正常(5)</el-radio-button>
              <el-radio-button label="abnormal">异常(1)</el-radio-button>
            </el-radio-group>
          </div>

          <!-- 气源列表 -->
          <div class="source-list">
            <div v-for="source in filteredSources" :key="source.id" class="source-item"
              :class="{ abnormal: source.status === 'abnormal' }">
              <div class="source-info">
                <span class="source-name">{{ source.name }}</span>
                <span class="source-status" :class="source.status">
                  {{ source.status === 'normal' ? '正常' : '异常' }}
                </span>
              </div>
              <div class="source-pressure" v-if="source.status === 'abnormal'">
                气源压力 {{ source.pressure }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最小化状态 -->
      <div v-else class="minimized-panel" @click="restorePanel">
        <el-tooltip content="展开气源管理" placement="right">
          <el-icon size="20">
            <DataLine />
          </el-icon>
        </el-tooltip>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Minus,
  Close,
  Search,
  DataLine
} from '@element-plus/icons-vue'

interface GasSource {
  id: number
  name: string
  status: 'normal' | 'abnormal'
  pressure?: string
}

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  position: {
    type: String,
    default: 'left', // left, right, top, bottom
    validator: (value: string) => ['left', 'right', 'top', 'bottom'].includes(value)
  }
})

const emit = defineEmits(['close'])

const isMinimized = ref(false)
const searchKeyword = ref('')
const activeFilter = ref('all')

// 模拟气源数据
const gasSources = ref<GasSource[]>([
  { id: 1, name: 'FC1', status: 'normal' },
  { id: 2, name: 'FC2', status: 'normal' },
  { id: 3, name: 'FC3', status: 'normal' },
  { id: 4, name: 'FC4', status: 'normal' },
  { id: 5, name: 'FC5', status: 'abnormal', pressure: '0.8MPa' },
  { id: 6, name: 'FC6', status: 'normal' }
])

// 过滤后的气源列表
const filteredSources = computed(() => {
  let filtered = gasSources.value

  // 根据筛选条件过滤
  if (activeFilter.value !== 'all') {
    filtered = filtered.filter(source => source.status === activeFilter.value)
  }

  // 根据搜索关键词过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(source =>
      source.name.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

// 最小化面板
const minimizePanel = () => {
  isMinimized.value = true
}

// 恢复面板
const restorePanel = () => {
  isMinimized.value = false
}

// 关闭面板
const closePanel = () => {
  emit('close')
}

// 搜索处理
const handleSearch = () => {
  console.log('搜索关键词:', searchKeyword.value)
}

// 筛选条件变化处理
const handleFilterChange = (filter: string) => {
  console.log('筛选条件:', filter)
}

// 初始化时显示面板
onMounted(() => {
  if (props.visible) {
    isMinimized.value = false
  }
})
</script>

<style scoped>
/* 添加位置样式 */
.gas-source-panel.left {
  left: 20px;
  top: 20px;
}

.gas-source-panel.right {
  right: 20px;
  top: 20px;
}

.gas-source-panel.top {
  left: 50%;
  top: 20px;
  transform: translateX(-50%);
}

.gas-source-panel.bottom {
  left: 50%;
  bottom: 80px;
  /* 避免和控制组件重叠 */
  transform: translateX(-50%);
}

/* 最小化图标位置调整 */
.gas-source-panel.minimized.left {
  left: 20px;
  bottom: 20px;
}

.gas-source-panel.minimized.right {
  right: 20px;
  bottom: 20px;
}

.gas-source-panel.minimized.top {
  left: 50%;
  top: 20px;
  transform: translateX(-50%);
}

.gas-source-panel.minimized.bottom {
  left: 50%;
  bottom: 80px;
  transform: translateX(-50%);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .gas-source-panel.left {
    left: 10px;
    top: 10px;
  }

  .gas-source-panel.right {
    right: 10px;
    top: 10px;
  }

  .gas-source-panel.minimized.left {
    left: 10px;
    bottom: 10px;
  }

  .gas-source-panel.minimized.right {
    right: 10px;
    bottom: 10px;
  }
}

.gas-source-panel {
  position: absolute;
  left: 20px;
  top: 20px;
  z-index: 999;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  width: 320px;
  transition: all 0.3s ease;
}

.gas-source-panel.minimized {
  width: auto;
}

.panel-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.panel-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-section {
  width: 100%;
}

.filter-section {
  width: 100%;
}

:deep(.el-radio-group) {
  width: 100%;
}

:deep(.el-radio-button) {
  flex: 1;
}

:deep(.el-radio-button__inner) {
  width: 100%;
}

.source-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.source-item {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.2s ease;
}

.source-item:hover {
  border-color: #165DFF;
  background: #f0f7ff;
}

.source-item.abnormal {
  border-color: #F53F3F;
  background: #fff3f3;
}

.source-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.source-name {
  font-weight: 600;
  color: #1f2937;
}

.source-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.source-status.normal {
  background: #edf7f0;
  color: #00B42A;
}

.source-status.abnormal {
  background: #fff3f3;
  color: #F53F3F;
}

.source-pressure {
  font-size: 12px;
  color: #F53F3F;
  font-weight: 500;
}

/* 最小化状态 */
.minimized-panel {
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
}

.minimized-panel:hover {
  background: #0e42d2;
  transform: scale(1.05);
}

/* 过渡动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gas-source-panel {
    left: 10px;
    top: 10px;
    width: 280px;
  }

  .panel-header {
    padding: 12px;
  }

  .panel-body {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .gas-source-panel {
    left: 8px;
    top: 8px;
    width: calc(100vw - 96px);
  }

  .minimized-panel {
    width: 36px;
    height: 36px;
  }
}
</style>
