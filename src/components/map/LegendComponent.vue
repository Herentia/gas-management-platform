<template>
  <div class="floating-panel legend-panel" :class="{ 'panel-hidden': !visible }" :style="panelStyle">
    <div class="panel-header" :style="headerStyle">
      <div class="panel-title">
        <el-icon>
          <Collection />
        </el-icon>
        <span>设备设施</span>
      </div>
      <div class="panel-actions">
        <el-button link :icon="Close" @click="handleClose" class="close-btn" />
      </div>
    </div>

    <div class="panel-content">
      <div class="legend-content">
        <!-- 全选区域 -->
        <div class="select-all-section">
          <el-checkbox v-model="allSelected" @change="handleAllSelectChange" class="select-all-checkbox">
            全选
          </el-checkbox>
        </div>

        <!-- 设备列表 - 两列布局 -->
        <div class="device-list">
          <div v-for="item in legendItems" :key="item.id" class="device-item">
            <el-checkbox v-model="item.selected" @change="handleDeviceSelectChange(item)" class="device-checkbox">
              <div class="device-content">
                <div class="device-icon" :style="{ color: item.color }">
                  <component :is="item.icon" />
                </div>
                <span class="device-name">{{ item.name }}</span>
              </div>
            </el-checkbox>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  Box,
  // Cabinet,
  SetUp,
  Switch,
  DataLine,
  Monitor,
  OfficeBuilding,
  Collection,
  Close
} from '@element-plus/icons-vue'

// 在 defineProps 之前定义接口和默认值
interface LegendItem {
  id: number
  name: string
  selected: boolean
  color: string
  icon: any
}

interface ThemeColors {
  primary: string
  lightBlue: string
  darkBlue: string
  accentBlue: string
  borderBlue: string
}

// 将默认主题定义移到模块作用域
const defaultTheme: ThemeColors = {
  primary: '#1E6FBA',
  lightBlue: '#E8F4FE',
  darkBlue: '#165B9C',
  accentBlue: '#2B8DE3',
  borderBlue: '#B8D9F5'
}

// Props 定义
interface Props {
  visible?: boolean
  themeColors?: ThemeColors
}

// 使用工厂函数提供默认值
const props = withDefaults(defineProps<Props>(), {
  visible: false,
  themeColors: () => ({
    primary: '#1E6FBA',
    lightBlue: '#E8F4FE',
    darkBlue: '#165B9C',
    accentBlue: '#2B8DE3',
    borderBlue: '#B8D9F5'
  })
})

// Emits
const emit = defineEmits<{
  close: []
  selectionChange: [items: LegendItem[]]
}>()

// 计算样式 - 使用 props.themeColors
const panelStyle = computed(() => ({
  background: `linear-gradient(135deg, ${props.themeColors.lightBlue} 0%, white 100%)`,
  border: `1px solid ${props.themeColors.borderBlue}`
}))

const headerStyle = computed(() => ({
  background: `linear-gradient(90deg, ${props.themeColors.primary} 0%, ${props.themeColors.darkBlue} 100%)`,
  borderBottom: `1px solid ${props.themeColors.borderBlue}`
}))

const allSelected = ref(false)
const legendItems = ref<LegendItem[]>([
  { id: 1, name: '调压箱', selected: false, color: '#1E6FBA', icon: Box },
  { id: 2, name: '调压柜', selected: false, color: '#FF6B6B', icon: Box },
  { id: 3, name: '撬装柜', selected: false, color: '#4ECDC4', icon: SetUp },
  { id: 4, name: '阀门', selected: false, color: '#45B7D1', icon: Switch },
  { id: 5, name: '流量计', selected: false, color: '#FFA07A', icon: DataLine },
  { id: 6, name: '压力计', selected: false, color: '#98D8C8', icon: Monitor },
  { id: 7, name: '场站', selected: false, color: '#9B59B6', icon: OfficeBuilding }
])

// 处理全选变化
const handleAllSelectChange = (value: boolean) => {
  legendItems.value.forEach(item => {
    item.selected = value
  })
  emitSelectionChange()
}

// 处理设备选择变化
const handleDeviceSelectChange = (changedItem: LegendItem) => {
  emitSelectionChange()
}

// 发射选择变化事件
const emitSelectionChange = () => {
  emit('selectionChange', legendItems.value.filter(item => item.selected))
}

// 处理关闭
const handleClose = () => {
  emit('close')
}

// 监听图例项变化，更新全选状态
watch(legendItems, (newVal) => {
  const allChecked = newVal.every(item => item.selected)
  allSelected.value = allChecked
}, { deep: true })
</script>

<style scoped>
.legend-panel {
  position: absolute;
  left: 20px;
  top: 20px;
  width: 320px;
  min-width: 280px;
  max-width: 400px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(30, 111, 186, 0.2);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
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
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.select-all-section {
  padding: 12px 0;
  border-bottom: 1px solid #e8f4fe;
  margin-bottom: 12px;
}

.select-all-checkbox {
  width: 100%;
}

.select-all-checkbox :deep(.el-checkbox__label) {
  font-size: 14px;
  font-weight: 600;
  color: #1E6FBA;
}

.device-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
  flex: 1;
}

.device-item {
  display: flex;
  align-items: center;
}

.device-checkbox {
  width: 100%;
}

.device-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
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
}

:deep(.el-checkbox__inner) {
  border-color: #dcdfe6;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #1E6FBA;
  border-color: #1E6FBA;
}

:deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  background-color: #1E6FBA;
  border-color: #1E6FBA;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .legend-panel {
    left: 10px;
    right: 10px;
    top: 10px;
    width: auto;
    min-width: unset;
    max-width: unset;
  }

  .device-list {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .legend-content {
    padding: 12px;
  }
}
</style>
