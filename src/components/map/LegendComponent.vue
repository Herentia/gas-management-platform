<template>
  <div class="floating-panel legend-panel" :class="{ 'panel-hidden': !visible }" :style="panelStyle" ref="panelRef">
    <div class="panel-header" :style="headerStyle">
      <div class="panel-title">
        <el-icon>
          <Collection />
        </el-icon>
        <span>{{ title }}</span>
      </div>
      <div class="panel-actions">
        <el-button link :icon="Close" @click="handleClose" class="close-btn" />
      </div>
    </div>

    <div class="panel-content" ref="contentRef">
      <div class="legend-content" :style="contentStyle">
        <!-- 全选区域 -->
        <div class="select-all-section" v-if="showSelectAll">
          <el-checkbox v-model="allSelected" @change="handleAllSelectChange" class="select-all-checkbox"
            :indeterminate="isIndeterminate">
            全选
          </el-checkbox>
        </div>

        <!-- 搜索框（当图例项较多时显示） -->
        <div class="search-section" v-if="showSearch && legendItems.length > searchThreshold">
          <el-input v-model="searchKeyword" placeholder="搜索图例..." size="small" clearable :prefix-icon="Search"
            @input="handleSearch" />
        </div>

        <!-- 设备列表 - 动态列布局 -->
        <div class="device-list" :class="gridClass" ref="listRef">
          <div v-for="item in filteredItems" :key="getItemKey(item)" class="device-item">
            <el-checkbox v-model="item.selected" @change="handleDeviceSelectChange(item)" class="device-checkbox"
              :disabled="item.disabled">
              <div class="device-content">
                <div class="device-icon" :style="{ color: item.color }">
                  <component :is="item.icon" />
                </div>
                <span class="device-name">{{ item.name }}</span>
                <span v-if="item.count !== undefined" class="device-count">
                  ({{ item.count }})
                </span>
              </div>
            </el-checkbox>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredItems.length === 0" class="empty-state">
          <el-icon>
            <Search />
          </el-icon>
          <span>未找到匹配的图例</span>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons" v-if="showActionButtons">
          <el-button size="small" @click="selectAll" :disabled="allSelected">
            全选
          </el-button>
          <el-button size="small" @click="clearAll" :disabled="noneSelected">
            清空
          </el-button>
          <el-button size="small" @click="resetToDefault">
            重置
          </el-button>
        </div>
      </div>
    </div>

    <!-- 调整大小手柄 -->
    <div class="panel-resize-handle" @mousedown="startResize"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick, onUnmounted } from 'vue'
import {
  Box,
  SetUp,
  Switch,
  DataLine,
  Monitor,
  OfficeBuilding,
  Collection,
  Close,
  Search
} from '@element-plus/icons-vue'

// 图例项接口
interface LegendItem {
  id?: string | number
  name: string
  selected: boolean
  color: string
  icon: any
  type?: string
  count?: number
  disabled?: boolean
  description?: string
}

// 主题颜色接口
interface ThemeColors {
  primary: string
  lightBlue: string
  darkBlue: string
  accentBlue: string
  borderBlue: string
}

// Props 定义
interface Props {
  visible?: boolean
  title?: string
  legendItems?: LegendItem[]
  themeColors?: ThemeColors
  position?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  minWidth?: number
  maxWidth?: number
  maxHeight?: string
  showSelectAll?: boolean
  showSearch?: boolean
  showActionButtons?: boolean
  searchThreshold?: number
  autoResize?: boolean
  resizable?: boolean
  defaultSelected?: (string | number)[]
}

// 使用工厂函数提供默认值
const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '设备设施',
  legendItems: () => [],
  themeColors: () => ({
    primary: '#1E6FBA',
    lightBlue: '#E8F4FE',
    darkBlue: '#165B9C',
    accentBlue: '#2B8DE3',
    borderBlue: '#B8D9F5'
  }),
  position: () => ({
    top: '20px',
    left: '20px'
  }),
  minWidth: 280,
  maxWidth: 400,
  maxHeight: '500px',
  showSelectAll: true,
  showSearch: true,
  showActionButtons: true,
  searchThreshold: 8,
  autoResize: true,
  resizable: true,
  defaultSelected: () => []
})

// Emits
const emit = defineEmits<{
  close: []
  selectionChange: [items: LegendItem[]]
  itemClick: [item: LegendItem]
}>()

// Refs
const panelRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()
const listRef = ref<HTMLElement>()
const searchKeyword = ref('')
const isResizing = ref(false)
const panelWidth = ref(props.minWidth)
const startResizeWidth = ref(0)
const startResizeX = ref(0)

// 响应式数据
const internalLegendItems = ref<LegendItem[]>([])

// 计算属性
// 过滤后的图例项
const filteredItems = computed(() => {
  if (!searchKeyword.value.trim()) {
    return internalLegendItems.value
  }

  const keyword = searchKeyword.value.toLowerCase()
  return internalLegendItems.value.filter(item =>
    item.name.toLowerCase().includes(keyword) ||
    item.type?.toLowerCase().includes(keyword) ||
    item.description?.toLowerCase().includes(keyword)
  )
})

// 全选状态
const allSelected = computed({
  get: () => filteredItems.value.length > 0 &&
    filteredItems.value.every(item => item.selected || item.disabled),
  set: (value) => {
    internalLegendItems.value.forEach(item => {
      if (!item.disabled) {
        item.selected = value
      }
    })
    emitSelectionChange()
  }
})

// 不确定状态（部分选中）
const isIndeterminate = computed(() => {
  const validItems = filteredItems.value.filter(item => !item.disabled)
  if (validItems.length === 0) return false

  const selectedCount = validItems.filter(item => item.selected).length
  return selectedCount > 0 && selectedCount < validItems.length
})

// 无选中项
const noneSelected = computed(() => {
  return filteredItems.value.length === 0 ||
    filteredItems.value.every(item => !item.selected)
})

// 网格布局类
const gridClass = computed(() => {
  const itemCount = filteredItems.value.length
  if (itemCount <= 4) return 'grid-1'
  if (itemCount <= 8) return 'grid-2'
  return 'grid-3'
})

// 面板样式
const panelStyle = computed(() => {
  const style: any = {
    background: `linear-gradient(135deg, ${props.themeColors.lightBlue} 0%, white 100%)`,
    border: `1px solid ${props.themeColors.borderBlue}`,
    width: `${panelWidth.value}px`,
    top: props.position.top,
    right: props.position.right,
    bottom: props.position.bottom,
    left: props.position.left,
    minWidth: `${props.minWidth}px`,
    maxWidth: `${props.maxWidth}px`
  }

  // 动态计算最大高度
  if (props.autoResize) {
    const viewportHeight = window.innerHeight
    const maxPanelHeight = Math.min(viewportHeight * 0.7, parseInt(props.maxHeight) || 500)
    style.maxHeight = `${maxPanelHeight}px`
  }

  return style
})

// 内容区域样式
const contentStyle = computed(() => {
  const style: any = {}

  // 根据内容项数调整内边距
  const itemCount = filteredItems.value.length
  if (itemCount <= 4) {
    style.padding = '12px'
  } else if (itemCount <= 8) {
    style.padding = '16px'
  } else {
    style.padding = '20px'
  }

  return style
})

const headerStyle = computed(() => ({
  background: `linear-gradient(90deg, ${props.themeColors.primary} 0%, ${props.themeColors.darkBlue} 100%)`,
  borderBottom: `1px solid ${props.themeColors.borderBlue}`
}))

// 方法
// 获取图例项唯一键
const getItemKey = (item: LegendItem) => {
  return item.id !== undefined ? item.id : item.name
}

// 处理外部传入的legendItems
const processLegendItems = (items: LegendItem[]) => {
  return items.map(item => ({
    ...item,
    selected: props.defaultSelected.includes(getItemKey(item)) || item.selected || false,
    disabled: item.disabled || false
  }))
}

// 处理全选变化
const handleAllSelectChange = (value: boolean) => {
  internalLegendItems.value.forEach(item => {
    if (!item.disabled) {
      item.selected = value
    }
  })
  emitSelectionChange()
}

// 处理设备选择变化
const handleDeviceSelectChange = (changedItem: LegendItem) => {
  emit('itemClick', changedItem)
  emitSelectionChange()
}

// 处理搜索
const handleSearch = () => {
  // 搜索时自动调整面板大小
  if (props.autoResize) {
    nextTick(adjustPanelSize)
  }
}

// 发射选择变化事件
const emitSelectionChange = () => {
  const selectedItems = internalLegendItems.value.filter(item => item.selected)
  emit('selectionChange', selectedItems)
}

// 处理关闭
const handleClose = () => {
  emit('close')
}

// 调整面板大小
const adjustPanelSize = () => {
  if (!panelRef.value || !props.autoResize) return

  nextTick(() => {
    const contentHeight = contentRef.value?.scrollHeight || 0
    const headerHeight = 56 // 头部固定高度
    const minHeight = headerHeight + 120 // 最小高度

    // 动态调整宽度
    const itemCount = filteredItems.value.length
    if (itemCount <= 4) {
      panelWidth.value = Math.max(props.minWidth, 250)
    } else if (itemCount <= 8) {
      panelWidth.value = Math.max(props.minWidth, 300)
    } else {
      panelWidth.value = Math.min(props.maxWidth, 350)
    }
  })
}

// 开始调整大小
const startResize = (e: MouseEvent) => {
  if (!props.resizable) return

  e.preventDefault()
  isResizing.value = true
  startResizeWidth.value = panelWidth.value
  startResizeX.value = e.clientX

  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (!isResizing.value) return

    const deltaX = moveEvent.clientX - startResizeX.value
    const newWidth = Math.max(
      props.minWidth,
      Math.min(props.maxWidth, startResizeWidth.value + deltaX)
    )

    panelWidth.value = newWidth
  }

  const handleMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 操作按钮方法
const selectAll = () => {
  allSelected.value = true
}

const clearAll = () => {
  internalLegendItems.value.forEach(item => {
    if (!item.disabled) {
      item.selected = false
    }
  })
  emitSelectionChange()
}

const resetToDefault = () => {
  internalLegendItems.value = processLegendItems(props.legendItems)
  emitSelectionChange()
}

// 监听外部legendItems变化
watch(() => props.legendItems, (newItems) => {
  internalLegendItems.value = processLegendItems(newItems)
  nextTick(adjustPanelSize)
}, { immediate: true, deep: true })

// 监听可见性变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    nextTick(adjustPanelSize)
  }
})

// 监听搜索关键词变化
watch(searchKeyword, () => {
  nextTick(adjustPanelSize)
})

// 生命周期
onMounted(() => {
  // 初始调整大小
  nextTick(adjustPanelSize)

  // 监听窗口大小变化
  window.addEventListener('resize', adjustPanelSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', adjustPanelSize)
})
</script>

<style scoped>
.legend-panel {
  position: absolute;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(30, 111, 186, 0.2);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.legend-panel.panel-hidden {
  opacity: 0;
  visibility: hidden;
  transform: scale(0.95);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px 8px 0 0;
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: white;
}

.panel-title .el-icon {
  color: white;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.close-btn {
  padding: 4px;
  color: rgba(255, 255, 255, 0.8);
}

.close-btn:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.panel-content {
  flex: 1;
  overflow: hidden;
  border-radius: 0 0 8px 8px;
  background: transparent;
}

.legend-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.select-all-section {
  padding: 12px 0;
  border-bottom: 1px solid #e8f4fe;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.select-all-checkbox {
  width: 100%;
}

.select-all-checkbox :deep(.el-checkbox__label) {
  font-size: 14px;
  font-weight: 600;
  color: #1E6FBA;
}

.search-section {
  margin-bottom: 12px;
  flex-shrink: 0;
}

.search-section :deep(.el-input) {
  width: 100%;
}

.device-list {
  flex: 1;
  overflow-y: auto;
  gap: 8px 16px;
  align-content: flex-start;
}

/* 动态网格布局 */
.device-list.grid-1 {
  display: grid;
  grid-template-columns: 1fr;
}

.device-list.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.device-list.grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.device-item {
  display: flex;
  align-items: center;
  min-height: 32px;
}

.device-checkbox {
  width: 100%;
}

.device-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  flex: 1;
}

.device-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.device-icon svg {
  width: 16px;
  height: 16px;
}

.device-name {
  font-size: 13px;
  color: #333;
  line-height: 1.4;
  flex: 1;
}

.device-count {
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  text-align: center;
}

.empty-state .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e8f4fe;
  margin-top: 12px;
  flex-shrink: 0;
}

.action-buttons .el-button {
  flex: 1;
}

/* 调整大小手柄 */
.panel-resize-handle {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background: transparent;
  transition: background-color 0.2s ease;
  z-index: 1001;
}

.panel-resize-handle:hover {
  background: v-bind('props.themeColors.primary');
}

/* 滚动条样式优化 */
.device-list::-webkit-scrollbar {
  width: 4px;
}

.device-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.device-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.device-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 复选框样式优化 */
:deep(.el-checkbox) {
  margin-right: 0;
}

:deep(.el-checkbox__input) {
  margin-right: 8px;
}

:deep(.el-checkbox__label) {
  padding-left: 0;
  font-size: 13px;
  width: 100%;
}

:deep(.el-checkbox__inner) {
  border-color: #dcdfe6;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: v-bind('props.themeColors.primary');
  border-color: v-bind('props.themeColors.primary');
}

:deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  background-color: v-bind('props.themeColors.primary');
  border-color: v-bind('props.themeColors.primary');
}

:deep(.el-checkbox__input.is-disabled .el-checkbox__inner) {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
}

:deep(.el-checkbox.is-disabled .el-checkbox__label) {
  color: #c0c4cc;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .legend-panel {
    left: 10px !important;
    right: 10px !important;
    top: 10px !important;
    width: auto !important;
    min-width: unset;
    max-width: unset;
  }

  .device-list.grid-2,
  .device-list.grid-3 {
    grid-template-columns: 1fr;
  }

  .panel-resize-handle {
    display: none;
  }
}

/* 超小屏幕优化 */
@media (max-width: 480px) {
  .legend-content {
    padding: 8px !important;
  }

  .device-list {
    gap: 6px;
  }

  .device-content {
    gap: 6px;
  }

  .device-name {
    font-size: 12px;
  }
}
</style>
