<template>
  <div class="device-detail-panel compact">
    <!-- 面板头部 - 只显示设备名称 -->
    <div class="panel-header" :style="headerStyle">
      <div class="panel-title">
        <el-icon class="device-icon">
          <Monitor />
        </el-icon>
        <span class="device-name">{{ deviceData?.name || '设备详情' }}</span>
      </div>
      <div class="panel-actions">
        <el-button text @click="handleClose" class="close-btn" size="small">
          <el-icon>
            <Close />
          </el-icon>
        </el-button>
      </div>
    </div>

    <div class="panel-content" v-if="deviceData">
      <!-- 实时数据展示 -->
      <div class="realtime-data">
        <div class="data-cards">
          <div class="data-card">
            <div class="data-icon" :style="iconStyle">
              <el-icon>
                <DataLine />
              </el-icon>
            </div>
            <div class="data-content">
              <div class="data-label">累积量</div>
              <div class="data-value" :style="valueStyle">{{ chartData?.accumulated || '0' }} Nm³</div>
            </div>
          </div>
          <div class="data-card">
            <div class="data-icon" :style="iconStyle">
              <el-icon>
                <TrendCharts />
              </el-icon>
            </div>
            <div class="data-content">
              <div class="data-label">流量</div>
              <div class="data-value" :style="valueStyle">{{ chartData?.flowRate || '0.00' }} Nm³/h</div>
            </div>
          </div>
          <div class="data-card">
            <div class="data-icon" :style="iconStyle">
              <el-icon>
                <Sunny />
              </el-icon>
            </div>
            <div class="data-content">
              <div class="data-label">温度</div>
              <div class="data-value" :style="valueStyle">{{ chartData?.temperature || '0' }} °C</div>
            </div>
          </div>
          <div class="data-card">
            <div class="data-icon" :style="iconStyle">
              <el-icon>
                <Opportunity />
              </el-icon>
            </div>
            <div class="data-content">
              <div class="data-label">压力</div>
              <div class="data-value" :style="valueStyle">{{ chartData?.pressure || '0.00' }} kPa</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 趋势图表 -->
      <div class="trend-chart">
        <div class="chart-container">
          <LineChart :chart-data="chartData" :height="160" />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" :icon="Download" @click="exportData" class="action-btn" size="small">
          导出数据
        </el-button>
        <el-button :icon="Refresh" @click="refreshData" class="action-btn" size="small">
          刷新数据
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
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
  chartData?: any
  themeColors?: {
    primary: string
    lightBlue: string
    darkBlue: string
    accentBlue: string
    borderBlue: string
  }
  onClose?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  themeColors: () => ({
    primary: '#1E6FBA',
    lightBlue: '#E8F4FE',
    darkBlue: '#165B9C',
    accentBlue: '#2B8DE3',
    borderBlue: '#B8D9F5'
  }),
  onClose: () => { }
})

// 计算样式
const headerStyle = ref({
  background: `linear-gradient(135deg, ${props.themeColors.primary} 0%, ${props.themeColors.darkBlue} 100%)`
})

const iconStyle = ref({
  background: props.themeColors.primary
})

const valueStyle = ref({
  color: props.themeColors.primary
})

const exportData = () => {
  console.log('导出设备数据:', props.deviceData)
  // 实现导出逻辑
}

const refreshData = () => {
  console.log('刷新设备数据')
  // 实现数据刷新逻辑
}

const handleClose = () => {
  props.onClose()
}

onUnmounted(() => {
  console.log('DeviceDetailPanel unmounted')
})
</script>

<style scoped>
.device-detail-panel.compact {
  background: white;
  width: 100%;
  max-width: 350px;
  min-width: 300px;
  border-radius: 8px;
  overflow: hidden;
}

/* 面板头部 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  color: white;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.device-icon {
  font-size: 16px;
  color: white;
}

.device-name {
  color: white;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  margin: 0;
}

.panel-actions .close-btn {
  color: rgba(255, 255, 255, 0.9);
  padding: 4px 6px;
  font-size: 14px;
  border: none;
  background: transparent;
  min-width: auto;
  width: auto;
  height: auto;
}

.panel-actions .close-btn:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.panel-actions .close-btn:deep(.el-icon) {
  font-size: 16px;
}

.panel-content {
  padding: 12px;
}

/* 实时数据卡片样式 */
.realtime-data {
  margin-bottom: 12px;
}

.data-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.data-card {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.data-card:hover {
  border-color: #1E6FBA;
  box-shadow: 0 2px 6px rgba(30, 111, 186, 0.1);
}

.data-icon {
  width: 28px;
  height: 28px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  flex-shrink: 0;
}

.data-content {
  flex: 1;
  min-width: 0;
}

.data-label {
  font-size: 10px;
  color: #666;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.data-value {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 趋势图表样式 */
.trend-chart {
  background: #f8fafc;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 12px;
}

.chart-container {
  height: 160px;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.action-btn {
  min-width: 80px;
  font-size: 12px;
  padding: 6px 12px;
  height: auto;
  flex: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .device-detail-panel.compact {
    max-width: 320px;
    min-width: 280px;
  }

  .data-cards {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
