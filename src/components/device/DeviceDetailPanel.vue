<template>
  <div class="device-detail-panel">
    <!-- 面板头部 -->
    <div class="panel-header" :style="headerStyle">
      <div class="panel-title">
        <el-icon class="device-icon">
          <Monitor />
        </el-icon>
        <div class="title-content">
          <h3>{{ deviceData?.name || '设备详情' }}</h3>
          <div class="device-subtitle">
            <el-tag :type="getStatusType(deviceData?.status)" size="small">
              {{ deviceData?.status || '未知' }}
            </el-tag>
            <span class="device-type">{{ deviceData?.type }}</span>
          </div>
        </div>
      </div>
      <div class="panel-actions">
        <el-tooltip content="关闭">
          <el-button link :icon="Close" @click="$emit('close')" class="close-btn" />
        </el-tooltip>
      </div>
    </div>

    <div class="panel-content">
      <!-- 设备基本信息 -->
      <div class="device-basic-info">
        <div class="info-section">
          <h4>基本信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <label>设备编号:</label>
              <span class="info-value">{{ deviceData?.id || '--' }}</span>
            </div>
            <div class="info-item">
              <label>设备类型:</label>
              <span class="info-value">{{ deviceData?.type || '--' }}</span>
            </div>
            <div class="info-item">
              <label>位置坐标:</label>
              <span class="info-value">{{ deviceData?.location || '--' }}</span>
            </div>
            <div class="info-item">
              <label>最后更新:</label>
              <span class="info-value">{{ deviceData?.updateTime || '--' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 实时数据展示 -->
      <div class="realtime-data">
        <div class="section-header">
          <h4>实时监测数据</h4>
          <el-tag type="info" size="small">实时更新</el-tag>
        </div>
        <div class="data-cards">
          <div class="data-card" :style="cardStyle">
            <div class="data-icon" :style="iconStyle">
              <el-icon>
                <DataLine />
              </el-icon>
            </div>
            <div class="data-content">
              <div class="data-label">标况累积</div>
              <div class="data-value" :style="valueStyle">{{ chartData.accumulated }} Nm³</div>
            </div>
          </div>
          <div class="data-card" :style="cardStyle">
            <div class="data-icon" :style="iconStyle">
              <el-icon>
                <TrendCharts />
              </el-icon>
            </div>
            <div class="data-content">
              <div class="data-label">标况流量</div>
              <div class="data-value" :style="valueStyle">{{ chartData.flowRate }} Nm³/h</div>
            </div>
          </div>
          <div class="data-card" :style="cardStyle">
            <div class="data-icon" :style="iconStyle">
              <el-icon>
                <Sunny />
              </el-icon>
            </div>
            <div class="data-content">
              <div class="data-label">温度</div>
              <div class="data-value" :style="valueStyle">{{ chartData.temperature }} °C</div>
            </div>
          </div>
          <div class="data-card" :style="cardStyle">
            <div class="data-icon" :style="iconStyle">
              <el-icon>
                <Opportunity />
              </el-icon>
            </div>
            <div class="data-content">
              <div class="data-label">压力</div>
              <div class="data-value" :style="valueStyle">{{ chartData.pressure }} kPa</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 趋势图表 -->
      <div class="trend-chart">
        <div class="section-header">
          <h4>趋势分析</h4>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-color temperature"></span>
              <span>温度 (°C)</span>
            </div>
            <div class="legend-item">
              <span class="legend-color pressure"></span>
              <span>压力 (kPa)</span>
            </div>
          </div>
        </div>
        <div class="chart-container">
          <LineChart :chart-data="chartData" :height="250" />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" :icon="Download" @click="exportData" class="action-btn">
          导出数据
        </el-button>
        <el-button :icon="Refresh" @click="refreshData" class="action-btn">
          刷新数据
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  Download,
  Refresh,
  Close,
  Monitor,
  DataLine,
  TrendCharts,
  Sunny,
  Opportunity
} from '@element-plus/icons-vue'
import LineChart from './LineChart.vue'

interface Props {
  deviceData?: any
  chartData: any
  themeColors?: {
    primary: string
    lightBlue: string
    darkBlue: string
    accentBlue: string
    borderBlue: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  themeColors: () => ({
    primary: '#1E6FBA',
    lightBlue: '#E8F4FE',
    darkBlue: '#165B9C',
    accentBlue: '#2B8DE3',
    borderBlue: '#B8D9F5'
  })
})

const emit = defineEmits<{
  close: []
}>()

// 计算样式
const headerStyle = computed(() => ({
  background: `linear-gradient(135deg, ${props.themeColors.primary} 0%, ${props.themeColors.darkBlue} 100%)`
}))

const cardStyle = computed(() => ({
  borderColor: props.themeColors.borderBlue
}))

const iconStyle = computed(() => ({
  background: props.themeColors.primary
}))

const valueStyle = computed(() => ({
  color: props.themeColors.primary
}))

const getStatusType = (status: string) => {
  const statusMap: Record<string, any> = {
    '正常': 'success',
    '警告': 'warning',
    '异常': 'danger',
    '离线': 'info'
  }
  return statusMap[status] || 'info'
}

const exportData = () => {
  console.log('导出设备数据:', props.deviceData)
  // 实现导出逻辑
}

const refreshData = () => {
  console.log('刷新设备数据')
  // 实现数据刷新逻辑
}
</script>

<style scoped>
.device-detail-panel {
  background: white;
  min-width: 450px;
  max-width: 800px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 20px;
  color: white;
}

.panel-title {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.device-icon {
  font-size: 24px;
  margin-top: 2px;
  color: white;
}

.title-content h3 {
  margin: 0 0 4px 0;
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.device-subtitle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-type {
  font-size: 12px;
  opacity: 0.9;
}

.panel-actions .close-btn {
  color: rgba(255, 255, 255, 0.8);
  padding: 6px;
  font-size: 16px;
}

.panel-actions .close-btn:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.panel-content {
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h4 {
  margin: 0;
  color: #1E6FBA;
  font-size: 16px;
  font-weight: 600;
}

/* 设备基本信息样式 */
.device-basic-info {
  margin-bottom: 24px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

/* 实时数据卡片样式 */
.realtime-data {
  margin-bottom: 24px;
}

.data-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.data-card {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.data-card:hover {
  box-shadow: 0 2px 8px rgba(30, 111, 186, 0.1);
  transform: translateY(-2px);
}

.data-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
}

.data-content {
  flex: 1;
}

.data-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.data-value {
  font-size: 18px;
  font-weight: 600;
}

/* 趋势图表样式 */
.trend-chart {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.chart-legend {
  display: flex;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.temperature {
  background: #ff6b6b;
}

.legend-color.pressure {
  background: #4ecdc4;
}

.chart-container {
  height: 250px;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.action-btn {
  min-width: 120px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .device-detail-panel {
    min-width: 300px;
  }

  .data-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .panel-header {
    flex-direction: column;
    gap: 12px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
