<!-- src/components/map/TerminalStatsPanel.vue -->
<template>
  <div class="terminal-stats-panel">
    <div class="stats-header">
      <div class="stats-title">终端设备统计</div>
      <div class="time-selector">
        <el-select v-model="timeRange" size="small" style="width: 100px">
          <el-option label="今日" value="today" />
          <el-option label="本周" value="week" />
          <el-option label="本月" value="month" />
        </el-select>
      </div>
    </div>

    <div class="stats-content">
      <!-- 一行显示所有统计内容 -->
      <div class="stats-row">
        <!-- 左侧：报警统计区域 -->
        <div class="stats-left">
          <div class="alarm-section">
            <div class="alarm-header">
              <div class="section-title">报警统计</div>
            </div>

            <div class="alarm-content">
              <!-- 左侧：报警卡片区域 -->
              <div class="alarm-cards-column">
                <div class="alarm-card today">
                  <div class="alarm-card-header">
                    <el-icon :size="14" class="card-icon">
                      <Bell />
                    </el-icon>
                    <span class="card-title">今日报警</span>
                  </div>
                  <div class="alarm-card-body">
                    <div class="alarm-count">{{ alarmStats.today }}</div>
                    <div class="alarm-trend" :class="getTrendClass('today')">
                      <el-icon :size="10">
                        <ArrowUp v-if="alarmTrend.today > 0" />
                        <ArrowDown v-else />
                      </el-icon>
                      <span>{{ Math.abs(alarmTrend.today) }}%</span>
                    </div>
                  </div>
                </div>

                <div class="alarm-card pending">
                  <div class="alarm-card-header">
                    <el-icon :size="14" class="card-icon">
                      <Clock />
                    </el-icon>
                    <span class="card-title">未处理报警</span>
                  </div>
                  <div class="alarm-card-body">
                    <div class="alarm-count">{{ alarmStats.pending }}</div>
                    <div class="alarm-detail">
                      <div class="detail-item">
                        <span class="detail-label">超时:</span>
                        <span class="detail-value">{{ alarmStats.overtime || 2 }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">高优先级:</span>
                        <span class="detail-value">{{ alarmStats.highPriority || 3 }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 右侧：报警类型分布 -->
              <div class="alarm-chart-column">
                <div class="chart-title-small">报警类型分布</div>
                <div ref="alarmTypeChartRef" class="chart-wrapper-small"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间分隔线 -->
        <div class="divider-vertical"></div>

        <!-- 右侧：在线率趋势 -->
        <div class="stats-right">
          <div class="online-section">
            <div class="online-header">
              <div class="section-title">在线率统计</div>
              <div class="online-summary">
                <div class="summary-item">
                  <span class="summary-label">当前在线率:</span>
                  <span class="summary-value">{{ currentOnlineRate }}%</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">趋势:</span>
                  <span class="summary-trend" :style="{ color: trendColor }">
                    <el-icon :size="10">
                      <TrendCharts />
                    </el-icon>
                    {{ trendText }} {{ trendRateDisplay }}%
                  </span>
                </div>
              </div>
            </div>
            <div ref="onlineRateChartRef" class="chart-wrapper-large"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { Bell, Clock, DataLine, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const TrendCharts = DataLine
const timeRange = ref('today')

// 报警统计数据
const alarmStats = ref({
  today: 12,
  pending: 8,
  overtime: 2,
  highPriority: 3
})

// 报警趋势数据
const alarmTrend = ref({
  today: 15, // 百分比，正数表示上升
  pending: -5
})

// 在线率趋势数据
const onlineRateData = ref({
  dates: ['11-01', '11-02', '11-03', '11-04', '11-05', '11-06', '11-07'],
  rates: [98.2, 97.8, 98.5, 97.3, 98.1, 96.9, 98.3]
})

// 计算当前在线率
const currentOnlineRate = computed(() => {
  const rates = onlineRateData.value.rates
  return rates.length > 0 ? rates[rates.length - 1] : 0
})

// 计算趋势信息
const trendRate = computed(() => {
  const rates = onlineRateData.value.rates
  if (rates.length < 2) return 0
  return rates[rates.length - 1] - rates[0]
})

const trendText = computed(() => {
  const rate = trendRate.value
  if (rate > 0) return '上升'
  if (rate < 0) return '下降'
  return '持平'
})

const trendColor = computed(() => {
  const rate = trendRate.value
  if (rate > 0) return '#10b981' // 绿色
  if (rate < 0) return '#ef4444' // 红色
  return '#6b7280' // 灰色
})

const trendRateDisplay = computed(() => {
  return Math.abs(trendRate.value).toFixed(1)
})

// 获取趋势样式类
const getTrendClass = (type: string) => {
  const trend = alarmTrend.value[type as keyof typeof alarmTrend.value]
  return trend > 0 ? 'trend-up' : 'trend-down'
}

// 报警类型数据
const alarmTypeData = ref([
  { name: '低压报警', value: 45, color: '#f87171' },
  { name: '高压报警', value: 25, color: '#fb923c' },
  { name: '断线报警', value: 15, color: '#fbbf24' },
  { name: '设备故障', value: 10, color: '#a78bfa' },
  { name: '通讯异常', value: 5, color: '#60a5fa' }
])

// ECharts 实例
let alarmTypeChart: echarts.ECharts | null = null
let onlineRateChart: echarts.ECharts | null = null

// 使用正确的 ref 名称
const alarmTypeChartRef = ref<HTMLElement>()
const onlineRateChartRef = ref<HTMLElement>()

// 初始化报警类型饼图（缩小版）
const initAlarmTypeChart = () => {
  if (!alarmTypeChartRef.value) {
    console.error('报警类型图表容器未找到')
    return
  }

  try {
    // 如果已有实例，先销毁
    if (alarmTypeChart) {
      alarmTypeChart.dispose()
    }

    alarmTypeChart = echarts.init(alarmTypeChartRef.value)

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}次 ({d}%)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: {
          fontSize: 10,
          color: '#374151'
        }
      },
      legend: {
        orient: 'vertical',
        right: 2,
        top: 'middle',
        textStyle: {
          fontSize: 9,
          color: '#6b7280'
        },
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 3,
        formatter: (name: string) => {
          const item = alarmTypeData.value.find(d => d.name === name)
          return item ? `${name} (${item.value})` : name
        }
      },
      series: [
        {
          name: '报警类型',
          type: 'pie',
          radius: ['40%', '55%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 2,
            borderColor: '#fff',
            borderWidth: 1
          },
          label: {
            show: false
          },
          emphasis: {
            scale: true,
            scaleSize: 5,
            label: {
              show: true,
              fontSize: '9',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: alarmTypeData.value.map(item => ({
            value: item.value,
            name: item.name,
            itemStyle: {
              color: item.color
            }
          }))
        }
      ]
    }

    alarmTypeChart.setOption(option)
    console.log('报警类型图表初始化成功')
  } catch (error) {
    console.error('报警类型图表初始化失败:', error)
  }
}

// 初始化在线率趋势图（缩小版）
const initOnlineRateChart = () => {
  if (!onlineRateChartRef.value) {
    console.error('在线率图表容器未找到')
    return
  }

  try {
    // 如果已有实例，先销毁
    if (onlineRateChart) {
      onlineRateChart.dispose()
    }

    onlineRateChart = echarts.init(onlineRateChartRef.value)

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: '#9ca3af',
            width: 1
          }
        },
        formatter: (params: any) => {
          const date = params[0].axisValue
          const rate = params[0].data
          return `${date}<br/>在线率: <b>${rate}%</b>`
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1
      },
      grid: {
        left: '2%',
        right: '2%',
        bottom: '15%',
        top: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: onlineRateData.value.dates,
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 9,
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        min: 95,
        max: 100,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 9,
          formatter: '{value}%'
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed'
          }
        }
      },
      series: [
        {
          name: '在线率',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 3,
          lineStyle: {
            width: 1.5,
            color: '#1E6FBA'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(30, 111, 186, 0.2)' },
              { offset: 1, color: 'rgba(30, 111, 186, 0.05)' }
            ])
          },
          itemStyle: {
            color: '#1E6FBA',
            borderColor: '#fff',
            borderWidth: 1
          },
          data: onlineRateData.value.rates
        }
      ]
    }

    onlineRateChart.setOption(option)
    console.log('在线率图表初始化成功')
  } catch (error) {
    console.error('在线率图表初始化失败:', error)
  }
}

// 初始化所有图表
const initCharts = () => {
  initAlarmTypeChart()
  initOnlineRateChart()
}

// 监听时间范围变化
watch(timeRange, () => {
  updateChartData()
})

// 更新图表数据
const updateChartData = () => {
  // 模拟根据时间范围更新数据
  if (timeRange.value === 'week') {
    alarmStats.value = { today: 48, pending: 12, overtime: 5, highPriority: 8 }
    alarmTrend.value = { today: 8, pending: -2 }
    alarmTypeData.value = [
      { name: '低压报警', value: 120, color: '#f87171' },
      { name: '高压报警', value: 85, color: '#fb923c' },
      { name: '断线报警', value: 45, color: '#fbbf24' },
      { name: '设备故障', value: 32, color: '#a78bfa' },
      { name: '通讯异常', value: 20, color: '#60a5fa' }
    ]
    onlineRateData.value = {
      dates: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      rates: [98.1, 97.5, 98.3, 97.8, 98.0, 97.2, 98.5]
    }
  } else if (timeRange.value === 'month') {
    alarmStats.value = { today: 156, pending: 24, overtime: 12, highPriority: 15 }
    alarmTrend.value = { today: 12, pending: -8 }
    alarmTypeData.value = [
      { name: '低压报警', value: 450, color: '#f87171' },
      { name: '高压报警', value: 280, color: '#fb923c' },
      { name: '断线报警', value: 180, color: '#fbbf24' },
      { name: '设备故障', value: 120, color: '#a78bfa' },
      { name: '通讯异常', value: 80, color: '#60a5fa' }
    ]
    onlineRateData.value = {
      dates: ['第1周', '第2周', '第3周', '第4周'],
      rates: [97.8, 98.2, 97.5, 98.0]
    }
  } else {
    alarmStats.value = { today: 12, pending: 8, overtime: 2, highPriority: 3 }
    alarmTrend.value = { today: 15, pending: -5 }
    alarmTypeData.value = [
      { name: '低压报警', value: 45, color: '#f87171' },
      { name: '高压报警', value: 25, color: '#fb923c' },
      { name: '断线报警', value: 15, color: '#fbbf24' },
      { name: '设备故障', value: 10, color: '#a78bfa' },
      { name: '通讯异常', value: 5, color: '#60a5fa' }
    ]
    onlineRateData.value = {
      dates: ['11-01', '11-02', '11-03', '11-04', '11-05', '11-06', '11-07'],
      rates: [98.2, 97.8, 98.5, 97.3, 98.1, 96.9, 98.3]
    }
  }

  // 更新图表
  if (alarmTypeChart && onlineRateChart) {
    initAlarmTypeChart()
    initOnlineRateChart()
  }
}

// 处理窗口大小变化
const handleResize = () => {
  if (alarmTypeChart) {
    alarmTypeChart.resize()
  }
  if (onlineRateChart) {
    onlineRateChart.resize()
  }
}

onMounted(() => {
  // 等待DOM完全渲染
  nextTick(() => {
    setTimeout(() => {
      initCharts()
    }, 100)
  })

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (alarmTypeChart) {
    alarmTypeChart.dispose()
    alarmTypeChart = null
  }
  if (onlineRateChart) {
    onlineRateChart.dispose()
    onlineRateChart = null
  }
  window.removeEventListener('resize', handleResize)
})

// 暴露刷新方法
const refreshData = () => {
  console.log('刷新终端统计数据')
  updateChartData()
}

defineExpose({
  refreshData
})
</script>

<style scoped>
.terminal-stats-panel {
  height: 100%;
  padding: 10px;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.stats-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.stats-content {
  flex: 1;
  overflow: hidden;
}

.stats-row {
  display: flex;
  height: 100%;
  gap: 12px;
}

/* 左侧：报警统计区域 */
/* 优化左侧报警卡片区域高度 */
.stats-left {
  flex: 0.9;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.alarm-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 6px 8px;
  background: #f9fafb;
  overflow: hidden;
}

.alarm-header {
  margin-bottom: 6px;
  flex-shrink: 0;
}

.alarm-content {
  display: flex;
  flex: 1;
  gap: 8px;
  min-height: 0;
  overflow: hidden;
}

/* 左侧：报警卡片区域 - 确保完全显示 */
.alarm-cards-column {
  flex: 0.7;
  display: flex;
  /* flex-direction: column; */
  gap: 6px;
  min-width: 0;
  overflow: hidden;
}

.alarm-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 4px 6px;
  border-radius: 3px;
  min-height: 0;
  overflow: hidden;
}

.alarm-card-header {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-bottom: 4px;
  flex-shrink: 0;
}

.card-title {
  font-size: 10px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.alarm-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
  overflow: hidden;
}

.alarm-count {
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 2px;
  text-align: center;
}

.alarm-trend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
  font-size: 8px;
  font-weight: 500;
  flex-shrink: 0;
}

.alarm-detail {
  display: flex;
  justify-content: space-around;
  margin-top: 2px;
  flex-shrink: 0;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 1px;
}

.detail-label {
  font-size: 8px;
  color: #9ca3af;
}

.detail-value {
  font-size: 9px;
  font-weight: 600;
  color: #374151;
}

.alarm-card.today {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
}

.alarm-card.pending {
  background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
  border: 1px solid #fde047;
}

.alarm-card-header {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
}

.card-icon {
  flex-shrink: 0;
}

.alarm-card.today .card-icon {
  color: #ef4444;
}

.alarm-card.pending .card-icon {
  color: #eab308;
}

.card-title {
  font-size: 11px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.alarm-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.alarm-count {
  font-size: 20px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 2px;
  text-align: center;
}

.alarm-card.today .alarm-count {
  color: #dc2626;
}

.alarm-card.pending .alarm-count {
  color: #ca8a04;
}

.alarm-trend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 9px;
  font-weight: 500;
}

.trend-up {
  color: #10b981;
}

.trend-down {
  color: #ef4444;
}

.alarm-detail {
  display: flex;
  justify-content: space-around;
  margin-top: 2px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 2px;
}

.detail-label {
  font-size: 9px;
  color: #9ca3af;
}

.detail-value {
  font-size: 10px;
  font-weight: 600;
  color: #374151;
}

/* 右侧：报警类型分布 */
.alarm-chart-column {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chart-title-small {
  font-size: 10px;
  color: #6b7280;
  margin-bottom: 2px;
  text-align: center;
}

.chart-wrapper-small {
  flex: 1;
  min-height: 0;
}

/* 中间分隔线 */
.divider-vertical {
  width: 1px;
  background: #e5e7eb;
  margin: 4px 0;
}

/* 右侧：在线率趋势 */
.stats-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.online-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 8px;
  background: #f9fafb;
}

.online-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  flex-wrap: wrap;
  gap: 6px;
}

.online-summary {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
}

.summary-label {
  color: #6b7280;
}

.summary-value {
  font-weight: 600;
  color: #1E6FBA;
}

.summary-trend {
  display: flex;
  align-items: center;
  gap: 2px;
  font-weight: 500;
}

.chart-wrapper-large {
  flex: 1;
  min-height: 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-row {
    flex-direction: column;
    gap: 10px;
  }

  .divider-vertical {
    display: none;
  }

  .stats-left,
  .stats-right {
    min-height: 120px;
  }

  .alarm-content {
    flex-direction: column;
  }

  .alarm-cards-column {
    flex-direction: row;
  }
}

@media (max-width: 768px) {
  .alarm-cards-column {
    flex-direction: column;
  }

  .stats-row {
    gap: 8px;
  }
}

/* 确保图表容器有明确的尺寸 */
.chart-wrapper-small,
.chart-wrapper-large {
  width: 100%;
  height: 100%;
  position: relative;
}

/* ECharts 容器样式 */
:deep(.echarts) {
  width: 100% !important;
  height: 100% !important;
}

/* 确保图标正常显示 */
:deep(.el-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 紧凑布局调整 */
.alarm-card-header .el-icon {
  display: flex;
}

.summary-trend .el-icon {
  margin-right: 1px;
}

.alarm-trend .el-icon {
  margin-right: 1px;
}

/* 滚动条隐藏 */
.terminal-stats-panel {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.terminal-stats-panel::-webkit-scrollbar {
  display: none;
}

.stats-content {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.stats-content::-webkit-scrollbar {
  display: none;
}
</style>
