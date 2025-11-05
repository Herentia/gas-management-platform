<template>
  <div class="dynamic-popup" :style="popupStyle">
    <!-- 头部 -->
    <div class="popup-header" :style="headerStyle">
      <div class="header-main">
        <div class="title-section">
          <el-icon v-if="config.titleIcon" class="title-icon">
            <component :is="config.titleIcon" />
          </el-icon>
          <div class="title-content">
            <h3 class="popup-title">{{ config.title || '详细信息' }}</h3>
            <div class="popup-subtitle" v-if="config.subtitle">{{ config.subtitle }}</div>
          </div>
        </div>
        <el-button link :icon="Close" @click="handleClose" class="close-btn" size="small">
          <!-- 添加文字提示 -->
          <el-tooltip effect="dark" content="关闭" placement="top">
            <span class="close-text">关闭</span>
          </el-tooltip>
        </el-button>
      </div>
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
            <template v-if="field.slot">
              <slot :name="field.slot" :value="getFieldValue(field)" :row="rowData"></slot>
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
        @click="handleAction(action)" class="action-btn" size="small">
        {{ action.label }}
      </el-button>
    </div>

    <!-- 底部关闭按钮（备用） -->
    <div class="popup-footer" v-if="!showActions">
      <el-button @click="handleClose" class="footer-close-btn">关闭</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { ElTooltip } from 'element-plus'

// ... 原有的接口定义保持不变 ...

interface Props {
  rowData: any
  config: PopupConfig
  themeColors?: any
  onClose?: () => void
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
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
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
  position: relative;
}

.popup-header {
  padding: 0;
  color: white;
  flex-shrink: 0;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 20px;
  min-height: 60px;
  box-sizing: border-box;
}

.title-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0;
  /* 防止内容溢出 */
}

.title-icon {
  font-size: 20px;
  margin-top: 2px;
  flex-shrink: 0;
}

.title-content {
  flex: 1;
  min-width: 0;
}

.popup-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  color: white;
  word-wrap: break-word;
}

.popup-subtitle {
  font-size: 12px;
  opacity: 0.9;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 2px;
}

.close-btn {
  color: rgba(255, 255, 255, 0.9) !important;
  padding: 6px !important;
  margin-left: 12px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 4px;
  transition: all 0.3s ease;
  height: auto;
}

.close-btn:hover {
  color: white !important;
  background: rgba(255, 255, 255, 0.2) !important;
  transform: scale(1.05);
}

.close-text {
  font-size: 12px;
  margin-left: 4px;
}

.popup-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
  flex: 1;
}

/* 表格形式样式 */
.info-table {
  width: 100%;
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  /* padding-bottom: 12px; */
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
  padding: 12px;
  border-radius: 6px;
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  flex-shrink: 0;
  line-height: 1.5;
}

.info-value {
  flex: 1;
  font-size: 14px;
  color: #333;
  font-weight: 500;
  word-break: break-word;
  line-height: 1.5;
  padding-left: 8px;
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
  flex-shrink: 0;
}

.action-btn {
  flex: 1;
}

/* 底部关闭按钮 */
.popup-footer {
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
  background: #f8fafc;
  text-align: center;
  flex-shrink: 0;
}

.footer-close-btn {
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dynamic-popup {
    min-width: 280px;
    max-width: 90vw;
  }

  .header-main {
    padding: 12px 16px;
    min-height: 56px;
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

  .close-text {
    display: none;
    /* 移动端隐藏文字 */
  }
}

/* 确保关闭按钮始终可见 */
:deep(.el-button) {
  border: none;
}

:deep(.el-button--link) {
  border: none !important;
}

/* 防止父组件样式覆盖 */
.dynamic-popup {
  z-index: 1003;
  position: relative;
}

.popup-header {
  position: relative;
  z-index: 1;
}
</style>
