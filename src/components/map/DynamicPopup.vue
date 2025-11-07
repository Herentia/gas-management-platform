<template>
  <div class="dynamic-popup" :style="popupStyle">
    <!-- 头部 -->
    <div class="popup-header" :style="headerStyle">
      <div class="header-content">
        <div class="popup-title-section">
          <el-icon v-if="config.titleIcon" class="title-icon">
            <component :is="config.titleIcon" />
          </el-icon>
          <h3 class="popup-title">{{ config.title || '详细信息' }}</h3>
        </div>
        <div class="popup-subtitle" v-if="config.subtitle">{{ config.subtitle }}</div>
      </div>
      <el-button link :icon="Close" @click="handleClose" class="close-btn">X</el-button>
    </div>

    <!-- 内容区域 -->
    <div class="popup-content" ref="contentRef">
      <!-- 表格形式显示 -->
      <div v-if="config.displayType === 'table'" class="info-table">
        <div v-for="field in visibleFields" :key="field.key" class="info-row"
          :class="{ 'highlight-row': field.highlight }">
          <div class="info-label" :style="{ width: config.labelWidth || '100px' }">
            {{ field.label }}：
          </div>
          <div class="info-value">
            <template v-if="field.slot && slots && slots[field.slot]">
              <!-- 使用渲染函数 -->
              <component :is="slots[field.slot]({ value: getFieldValue(field), row: rowData })" />
            </template>
            <template v-else-if="field.slot === 'photos'">
              <!-- 内置的图片显示逻辑 -->
              <div class="photo-gallery">
                <div v-if="getFieldValue(field) && getFieldValue(field).length > 0" class="photo-list">
                  <el-image v-for="(photo, index) in getFieldValue(field)" :key="index" :src="photo"
                    :preview-src-list="getFieldValue(field)" :initial-index="index" fit="cover" class="photo-item"
                    :alt="`${field.label} ${index + 1}`">
                    <template #error>
                      <div class="image-error">
                        <el-icon>
                          <Picture />
                        </el-icon>
                        <span>图片加载失败</span>
                      </div>
                    </template>
                  </el-image>
                </div>
                <div v-else class="no-photos">
                  <el-icon>
                    <Picture />
                  </el-icon>
                  <span>暂无照片</span>
                </div>
              </div>
            </template>
            <template v-else>
              {{ getFieldValue(field) || '-' }}
            </template>
          </div>
        </div>
      </div>

      <!-- 卡片形式显示 -->
      <div v-else-if="config.displayType === 'cards'" class="info-cards">
        <div v-for="field in visibleFields" :key="field.key" class="info-card"
          :class="{ 'highlight-card': field.highlight }">
          <div class="card-label">{{ field.label }}</div>
          <div class="card-value">
            <template v-if="field.slot">
              <slot :name="field.slot" :value="getFieldValue(field)" :row="rowData"></slot>
            </template>
            <template v-else>
              {{ getFieldValue(field) || '-' }}
            </template>
          </div>
          <div class="card-unit" v-if="field.unit">{{ field.unit }}</div>
        </div>
      </div>

      <!-- 自定义内容插槽 -->
      <div v-else-if="config.displayType === 'custom'" class="custom-content">
        <slot name="custom-content" :row="rowData"></slot>
      </div>

      <!-- 图表展示（如果有图表数据） -->
      <div v-if="config.charts && config.charts.length > 0" class="charts-section">
        <div v-for="chart in config.charts" :key="chart.key" class="chart-item">
          <div class="chart-title">{{ chart.title }}</div>
          <div class="chart-container">
            <!-- 这里可以集成图表组件 -->
            <div class="chart-placeholder">
              {{ chart.title }} 图表区域
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="popup-actions" v-if="showActions">
      <el-button v-for="action in config.actions" :key="action.key" :type="action.type || 'primary'" :icon="action.icon"
        @click="handleAction(action)" class="action-btn">
        {{ action.label }}
      </el-button>
      <el-button @click="handleClose">关闭</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { Close, Picture } from '@element-plus/icons-vue'

// 字段配置接口
interface FieldConfig {
  key: string
  label: string
  path?: string // 数据路径，支持嵌套对象，如 'data.officialInfo.name'
  defaultValue?: any
  visible?: boolean
  slot?: string // 自定义插槽名称
  highlight?: boolean // 是否高亮显示
  unit?: string // 单位
  width?: string // 字段宽度
}

// 图表配置接口
interface ChartConfig {
  key: string
  title: string
  type: string // 'line' | 'bar' | 'pie' 等
  data: any[]
}

// 操作按钮配置接口
interface ActionConfig {
  key: string
  label: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  icon?: any
  handler?: (rowData: any) => void
}

// 弹窗配置接口
interface PopupConfig {
  title?: string
  subtitle?: string
  titleIcon?: any
  displayType?: 'table' | 'cards' | 'custom' // 显示类型
  fields: FieldConfig[] // 字段配置
  charts?: ChartConfig[] // 图表配置
  actions?: ActionConfig[] // 操作按钮
  maxWidth?: string // 最大宽度
  minWidth?: string // 最小宽度
  maxHeight?: string // 最大高度
  labelWidth?: string // 标签宽度
  autoResize?: boolean // 是否自动调整大小
}

// 在 DynamicPopup 组件的 Props 接口中添加 slots
interface Props {
  rowData: any
  config: PopupConfig
  themeColors?: any
  onClose?: () => void
  onAction?: (action: ActionConfig, rowData: any) => void
  slots?: Record<string, (props: { value: any; row: any }) => any> // 新增 slots prop
}

const props = withDefaults(defineProps<Props>(), {
  rowData: () => ({}),
  config: () => ({
    title: '详细信息',
    displayType: 'table',
    fields: [],
    autoResize: true
  }),
  themeColors: () => ({
    primary: '#1E6FBA',
    borderBlue: '#B8D9F5'
  })
})

const emit = defineEmits<{
  close: []
  action: [action: ActionConfig, rowData: any]
  viewDetail: [data: any]
}>()

const contentRef = ref<HTMLElement>()

// 计算可见字段
const visibleFields = computed(() => {
  return props.config.fields.filter(field => field.visible !== false)
})

// 计算是否显示操作按钮
const showActions = computed(() => {
  return props.config.actions && props.config.actions.length > 0
})

// 获取字段值（支持嵌套对象）
const getFieldValue = (field: FieldConfig) => {
  if (field.key) {
    return props.rowData[field.key] || field.defaultValue
  }

  if (!field.path) {
    return field.defaultValue
  }
  // 支持嵌套对象路径，如 'data.officialInfo.name'
  const paths = field.path.split('.')
  let value = props.rowData
  for (const path of paths) {
    if (value && value[path] !== undefined) {
      value = value[path]
    } else {
      return field.defaultValue
    }
  }
  return value || field.defaultValue
}

// 弹窗样式计算
const popupStyle = computed(() => {
  const style: any = {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    border: `1px solid ${props.themeColors.borderBlue}`,
    overflow: 'hidden'
  }

  // 设置宽度
  if (props.config.minWidth) {
    style.minWidth = props.config.minWidth
  }
  if (props.config.maxWidth) {
    style.maxWidth = props.config.maxWidth
  }

  return style
})

// 头部样式
const headerStyle = computed(() => ({
  background: `linear-gradient(90deg, ${props.themeColors.primary} 0%, #165B9C 100%)`
}))

// 处理操作按钮点击
const handleAction = (action: ActionConfig) => {
  if (action.handler) {
    action.handler(props.rowData)
  }
  emit('action', action, props.rowData)
}

const handleClose = () => {
  emit('close')
}

const handleViewDetail = () => {
  emit('viewDetail', props.rowData)
}

// 自动调整大小
onMounted(() => {
  if (props.config.autoResize && contentRef.value) {
    nextTick(() => {
      // 可以根据内容高度动态调整
      const contentHeight = contentRef.value?.scrollHeight || 0
      // 这里可以设置最大高度限制
    })
  }
})
</script>

<style scoped>
.dynamic-popup {
  min-width: 300px;
  max-width: 600px;
  background: white;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 20px;
  color: white;
  position: relative;
}

.header-content {
  flex: 1;
  min-width: 0;
  /* 防止标题过长挤压关闭按钮 */
}

.popup-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.title-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.popup-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  word-wrap: break-word;
}

.popup-subtitle {
  font-size: 12px;
  opacity: 0.9;
  line-height: 1.4;
}

/* 关闭按钮样式优化 */
.close-btn {
  color: rgba(255, 255, 255, 0.9) !important;
  padding: 8px !important;
  margin: -8px -8px -8px 16px !important;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 6px !important;
  border: none !important;
  width: 32px;
  height: 32px;
  display: flex !important;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;
  position: relative;
  z-index: 10;
}

.close-btn:hover {
  color: white !important;
  background: rgba(255, 255, 255, 0.2) !important;
  transform: scale(1.1);
}

.close-btn:active {
  transform: scale(0.95);
}

/* 确保关闭按钮图标可见 */
.close-btn :deep(svg) {
  width: 16px;
  height: 16px;
  font-size: 16px;
}

.popup-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

/* 表格形式样式 */
.info-table {
  width: 100%;
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.info-row.highlight-row {
  background: #f8fafc;
  margin: 0 -12px;
  padding: 8px 12px;
  border-radius: 4px;
  border-bottom: none;
}

.info-label {
  font-size: 13px;
  font-weight: 500;
  color: #666;
  flex-shrink: 0;
  line-height: 1.5;
}

.info-value {
  flex: 1;
  font-size: 13px;
  color: #333;
  font-weight: 500;
  word-break: break-all;
  line-height: 1.5;
}

/* 卡片形式样式 */
.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.info-card {
  background: #f8fafc;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
  border: 1px solid #e5e7eb;
}

.info-card.highlight-card {
  background: linear-gradient(135deg, #E8F4FE 0%, #f0f7ff 100%);
  border-color: v-bind('props.themeColors.borderBlue');
}

.card-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.card-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.card-unit {
  font-size: 11px;
  color: #999;
}

/* 图表区域 */
.charts-section {
  margin-top: 20px;
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.chart-item {
  margin-bottom: 16px;
}

.chart-item:last-child {
  margin-bottom: 0;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.chart-container {
  background: #f8fafc;
  border-radius: 6px;
  padding: 16px;
  min-height: 120px;
}

.chart-placeholder {
  text-align: center;
  color: #999;
  font-size: 13px;
  line-height: 120px;
}

/* 自定义内容区域 */
.custom-content {
  width: 100%;
}

/* 操作按钮 */
.popup-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: #f8fafc;
}

.action-btn {
  flex: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dynamic-popup {
    min-width: 280px;
    max-width: 90vw;
  }

  .popup-header {
    padding: 12px 16px;
  }

  .popup-content {
    padding: 16px;
    max-height: 50vh;
  }

  .info-cards {
    grid-template-columns: 1fr;
  }

  .popup-actions {
    padding: 12px 16px;
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }

  /* 移动端关闭按钮更大一些 */
  .close-btn {
    padding: 10px !important;
    width: 36px;
    height: 36px;
  }

  .close-btn :deep(svg) {
    width: 18px;
    height: 18px;
  }
}

/* 防止父组件样式覆盖关闭按钮 */
:deep(.close-btn) {
  border: none !important;
  outline: none !important;
}

:deep(.close-btn:hover) {
  border: none !important;
  outline: none !important;
}
</style>
