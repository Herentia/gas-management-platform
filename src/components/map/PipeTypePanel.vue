<template>
  <div class="pipe-type-panel" :class="{ 'panel-minimized': isMinimized }" :style="panelStyle">
    <!-- 面板头部 -->
    <div class="panel-header" @dblclick="toggleMinimize">
      <div class="panel-title">
        <el-icon>
          <Collection />
        </el-icon>
        <span>管网类型</span>
      </div>
      <div class="panel-actions">
        <el-tooltip :content="isMinimized ? '展开' : '最小化'">
          <el-button link :icon="isMinimized ? FullScreen : Minus" @click="toggleMinimize" />
        </el-tooltip>
        <el-tooltip content="关闭">
          <el-button link :icon="Close" @click="handleClose" />
        </el-tooltip>
      </div>
    </div>

    <!-- 面板内容 -->
    <div class="panel-content" v-show="!isMinimized">
      <!-- 搜索框 -->
      <div class="search-section">
        <el-input v-model="searchKeyword" placeholder="搜索管网类型" clearable @clear="handleSearchClear"
          @keyup.enter="handleSearch" class="search-input" size="small">
          <template #suffix>
            <el-icon class="search-icon" @click="handleSearch">
              <Search />
            </el-icon>
          </template>
        </el-input>
      </div>

      <!-- 分类内容 -->
      <div class="category-content">
        <el-collapse v-model="activeCategories" class="pipe-categories">
          <!-- 材质 -->
          <el-collapse-item name="material" class="category-item">
            <template #title>
              <div class="category-title">
                <el-icon>
                  <Box />
                </el-icon>
                <span>材质</span>
              </div>
            </template>
            <div class="category-options">
              <el-checkbox-group v-model="selectedMaterials">
                <el-checkbox label="无缝钢管" class="sub-option" />
                <el-checkbox label="镀锌钢管" class="sub-option" />
                <el-checkbox label="PE管道" class="sub-option" />
              </el-checkbox-group>
            </div>
          </el-collapse-item>

          <!-- 使用年限 -->
          <el-collapse-item name="years" class="category-item">
            <template #title>
              <div class="category-title">
                <el-icon>
                  <Clock />
                </el-icon>
                <span>使用年限</span>
              </div>
            </template>
            <div class="category-options">
              <el-checkbox-group v-model="selectedYears">
                <el-checkbox label="1年~5年" class="year-option" />
                <el-checkbox label="6年~10年" class="year-option" />
                <el-checkbox label="11年~15年" class="year-option" />
                <el-checkbox label="16年~20年" class="year-option" />
                <el-checkbox label="21年以上" class="year-option" />
              </el-checkbox-group>
            </div>
          </el-collapse-item>

          <!-- 压力等级 -->
          <el-collapse-item name="pressure" class="category-item">
            <template #title>
              <div class="category-title">
                <el-icon>
                  <TrendCharts />
                </el-icon>
                <span>压力等级</span>
              </div>
            </template>
            <div class="category-options">
              <el-checkbox-group v-model="selectedPressureLevels">
                <el-checkbox label="高压管道" class="pressure-option" />
                <el-checkbox label="中压管道" class="pressure-option" />
                <el-checkbox label="低压管道" class="pressure-option" />
              </el-checkbox-group>
            </div>
          </el-collapse-item>

          <!-- 防腐材料 -->
          <el-collapse-item name="anticorrosion" class="category-item">
            <template #title>
              <div class="category-title">
                <el-icon>
                  <Sunny />
                </el-icon>
                <span>防腐材料</span>
              </div>
            </template>
            <div class="category-options">
              <el-checkbox-group v-model="selectedAnticorrosion">
                <el-checkbox label="3PE防腐" class="anticorrosion-option" />
                <el-checkbox label="普通PE防腐" class="anticorrosion-option" />
                <el-checkbox label="沥青防腐" class="anticorrosion-option" />
                <el-checkbox label="抗UV漆" class="anticorrosion-option" />
              </el-checkbox-group>
            </div>
          </el-collapse-item>

          <!-- 管径 -->
          <el-collapse-item name="diameter" class="category-item">
            <template #title>
              <div class="category-title">
                <el-icon>
                  <DataLine />
                </el-icon>
                <span>管径</span>
              </div>
            </template>
            <div class="category-options">
              <el-checkbox-group v-model="selectedDiameters">
                <el-checkbox v-for="diameter in steelDiameters" :key="diameter" :label="diameter"
                  class="diameter-option" />
              </el-checkbox-group>
            </div>
          </el-collapse-item>

          <!-- 其他 -->
          <el-collapse-item name="other" class="category-item">
            <template #title>
              <div class="category-title">
                <el-icon>
                  <More />
                </el-icon>
                <span>其他</span>
              </div>
            </template>
            <div class="category-options">
              <el-checkbox-group v-model="selectedOthers">
                <el-checkbox label="停用管线" class="other-option" />
                <el-checkbox label="占压管线" class="other-option" />
                <el-checkbox label="停用设备设施" class="other-option" />
                <el-checkbox label="隐藏" class="other-option" />
              </el-checkbox-group>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" @click="handleApply" class="apply-btn">应用筛选</el-button>
        <el-button @click="handleReset" class="reset-btn">重置</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Collection, Search, Close, Minus, FullScreen, Box,
  Clock, TrendCharts, Sunny, DataLine, More
} from '@element-plus/icons-vue'
import { ref, computed, watch } from 'vue'

interface Props {
  position?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  size?: {
    width?: number
    height?: number
  }
  themeColors?: any
  onClose?: () => void
  onFilterChange?: (filters: any) => void
}

const props = withDefaults(defineProps<Props>(), {
  position: () => ({ right: '20px', top: '20px' }),
  size: () => ({ width: 320, height: 500 }),
  themeColors: () => ({
    primary: '#1E6FBA',
    lightBlue: '#E8F4FE',
    borderBlue: '#B8D9F5',
    darkBlue: '#165B9C'
  })
})

const emit = defineEmits<{
  close: []
  filterChange: [filters: any]
  minimize: [minimized: boolean]
}>()

// 响应式数据
const isMinimized = ref(false)
const searchKeyword = ref('')
const activeCategories = ref(['material', 'years', 'pressure', 'anticorrosion', 'diameter', 'other'])

// 筛选数据
const selectedMaterials = ref<string[]>([])
const selectedYears = ref<string[]>([])
const selectedPressureLevels = ref<string[]>([])
const selectedAnticorrosion = ref<string[]>([])
const selectedDiameters = ref<string[]>([])
const selectedOthers = ref<string[]>([])

// 管径数据
const steelDiameters = ref([
  '钢质DN22', '钢质DN38', '钢质DN89', '钢质DN159', '钢质DN273',
  '钢质DN32', '钢质DN57', '钢质DN108', '钢质DN219', 'PE De32', 'PE De110', 'PE De200', 'PE De20', 'PE De63', 'PE De160', 'PE De250'
])

// 面板样式
const panelStyle = computed(() => {
  const style: any = {
    width: `${props.size?.width || 320}px`,
    height: isMinimized.value ? 'auto' : `${props.size?.height || 500}px`,
    minWidth: '280px',
    maxWidth: '1200px',
    minHeight: isMinimized.value ? 'auto' : '400px',
    maxHeight: '80vh',
    background: 'linear-gradient(135deg, v-bind("props.themeColors.lightBlue") 0%, white 100%)',
    border: `1px solid ${props.themeColors.borderBlue}`
  }

  // 应用位置
  Object.assign(style, props.position)

  return style
})

// 事件处理
const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
  emit('minimize', isMinimized.value)

  // 调整地图大小
  setTimeout(() => {
    if (typeof (window as any).map?.updateSize === 'function') {
      (window as any).map.updateSize()
    }
  }, 100)
}

const handleClose = () => {
  emit('close')
}

const handleSearch = () => {
  console.log('搜索管网类型:', searchKeyword.value)
}

const handleSearchClear = () => {
  searchKeyword.value = ''
}

const handleApply = () => {
  const filters = {
    materials: selectedMaterials.value,
    years: selectedYears.value,
    pressureLevels: selectedPressureLevels.value,
    anticorrosion: selectedAnticorrosion.value,
    diameters: selectedDiameters.value,
    others: selectedOthers.value,
    searchKeyword: searchKeyword.value
  }

  console.log('应用筛选:', filters)
  emit('filterChange', filters)
}

const handleReset = () => {
  selectedMaterials.value = []
  selectedYears.value = []
  selectedPressureLevels.value = []
  selectedAnticorrosion.value = []
  selectedDiameters.value = []
  selectedOthers.value = []
  searchKeyword.value = ''

  console.log('重置筛选')
  emit('filterChange', {})
}

// 监听筛选变化
watch([
  selectedMaterials,
  selectedYears,
  selectedPressureLevels,
  selectedAnticorrosion,
  selectedDiameters,
  selectedOthers,
  searchKeyword
], () => {
  const filters = {
    materials: selectedMaterials.value,
    years: selectedYears.value,
    pressureLevels: selectedPressureLevels.value,
    anticorrosion: selectedAnticorrosion.value,
    diameters: selectedDiameters.value,
    others: selectedOthers.value,
    searchKeyword: searchKeyword.value
  }

  emit('filterChange', filters)
}, { deep: true })
</script>

<style scoped>
.pipe-type-panel {
  position: absolute;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(30, 111, 186, 0.2);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  user-select: none;
}

.pipe-type-panel.panel-minimized {
  min-height: auto;
  max-height: auto;
  height: auto !important;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid v-bind('props.themeColors.borderBlue');
  background: linear-gradient(90deg, v-bind('props.themeColors.primary') 0%, v-bind('props.themeColors.darkBlue') 100%);
  border-radius: 8px 8px 0 0;
  flex-shrink: 0;
  cursor: pointer;
  user-select: none;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: white;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.panel-actions .el-button {
  color: rgba(255, 255, 255, 0.8);
  padding: 4px;
}

.panel-actions .el-button:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0 0 8px 8px;
  background-color: rgba(255, 255, 255, 0.8);
}

/* 搜索区域 */
.search-section {
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.search-input {
  width: 100%;
}

.search-icon {
  cursor: pointer;
  color: v-bind('props.themeColors.primary');
}

:deep(.search-input .el-input__wrapper) {
  border-radius: 6px;
}

/* 分类内容 */
.category-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 8px;
}

.pipe-categories {
  border: none;
}

:deep(.pipe-categories .el-collapse-item__header) {
  height: 44px;
  line-height: 44px;
  padding: 0 8px;
  border: none;
  font-weight: 500;
  background: transparent;
}

:deep(.pipe-categories .el-collapse-item__wrap) {
  background: transparent;
  border: none;
}

:deep(.pipe-categories .el-collapse-item__content) {
  padding: 8px 8px 12px;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #333;
}

.category-title .el-icon {
  color: v-bind('props.themeColors.primary');
}

.category-options {
  padding-left: 4px;
}

.option-group {
  margin-bottom: 8px;
}

.option-main {
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  padding-left: 16px;
}

.option-subgroup {
  padding-left: 24px;
}

.sub-option {
  margin-bottom: 6px;
  /* margin-right: 50px; */
}

:deep(.sub-option .el-checkbox__label) {
  font-size: 12px;
  padding-right: 30px;
}

.year-option,
.pressure-option,
.anticorrosion-option,
.other-option {
  display: block;
  margin-bottom: 8px;
}

:deep(.year-option .el-checkbox__label),
:deep(.pressure-option .el-checkbox__label),
:deep(.anticorrosion-option .el-checkbox__label),
:deep(.other-option .el-checkbox__label) {
  font-size: 12px;
}

/* 管径样式 */
.diameter-section {
  margin-bottom: 12px;
}

.diameter-subtitle {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
  padding-left: 8px;
}

.diameter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding-left: 8px;
}

.diameter-option {
  margin: 0;
}

:deep(.diameter-option .el-checkbox__label) {
  font-size: 11px;
  white-space: nowrap;
}

/* 操作按钮 */
.action-buttons {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  background: white;
  flex-shrink: 0;
  display: flex;
  gap: 12px;
}

.apply-btn,
.reset-btn {
  flex: 1;
}

.apply-btn {
  background: v-bind('props.themeColors.primary');
  border-color: v-bind('props.themeColors.primary');
}

.apply-btn:hover {
  background: v-bind('props.themeColors.darkBlue');
  border-color: v-bind('props.themeColors.darkBlue');
}

/* 滚动条样式 */
.category-content::-webkit-scrollbar {
  width: 6px;
}

.category-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.category-content::-webkit-scrollbar-thumb {
  background: v-bind('props.themeColors.borderBlue');
  border-radius: 3px;
}

.category-content::-webkit-scrollbar-thumb:hover {
  background: v-bind('props.themeColors.primary');
}

/* 最小化状态 */
.panel-minimized .panel-header {
  border-radius: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pipe-type-panel {
    width: 280px !important;
    height: 400px !important;
    left: 10px !important;
    right: 10px !important;
    top: 10px !important;
    max-height: 70vh;
  }

  .diameter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
