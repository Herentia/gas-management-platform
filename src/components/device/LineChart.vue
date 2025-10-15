<template>
  <div ref="chartRef" :style="{ height: `${height}px` }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

interface Props {
  chartData: any
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 300
})

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

// 模拟时间数据
const timeData = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

const initChart = () => {
  if (!chartRef.value) return

  chart = echarts.init(chartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['温度', '压力'],
      top: 0,
      right: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timeData,
      axisLine: {
        lineStyle: {
          color: '#999'
        }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '温度 (°C)',
        position: 'left',
        axisLine: {
          lineStyle: {
            color: '#ff6b6b'
          }
        },
        axisLabel: {
          formatter: '{value} °C'
        },
        max: 100
      },
      {
        type: 'value',
        name: '压力 (kPa)',
        position: 'right',
        axisLine: {
          lineStyle: {
            color: '#4ecdc4'
          }
        },
        axisLabel: {
          formatter: '{value} kPa'
        },
        max: 100
      }
    ],
    series: [
      {
        name: '温度',
        type: 'line',
        yAxisIndex: 0,
        data: props.chartData.temperatureData || [20, 25, 30, 35, 40, 45],
        smooth: true,
        lineStyle: {
          color: '#ff6b6b',
          width: 3
        },
        itemStyle: {
          color: '#ff6b6b'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 107, 107, 0.3)' },
            { offset: 1, color: 'rgba(255, 107, 107, 0.1)' }
          ])
        }
      },
      {
        name: '压力',
        type: 'line',
        yAxisIndex: 1,
        data: props.chartData.pressureData || [60, 65, 70, 75, 80, 85],
        smooth: true,
        lineStyle: {
          color: '#4ecdc4',
          width: 3
        },
        itemStyle: {
          color: '#4ecdc4'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(78, 205, 196, 0.3)' },
            { offset: 1, color: 'rgba(78, 205, 196, 0.1)' }
          ])
        }
      }
    ]
  }

  chart.setOption(option)
}

const updateChart = () => {
  if (chart) {
    chart.setOption({
      series: [
        {
          data: props.chartData.temperatureData || [20, 25, 30, 35, 40, 45]
        },
        {
          data: props.chartData.pressureData || [60, 65, 70, 75, 80, 85]
        }
      ]
    })
  }
}

watch(() => props.chartData, updateChart, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chart) {
    chart.dispose()
  }
  window.removeEventListener('resize', handleResize)
})

const handleResize = () => {
  chart?.resize()
}
</script>

<style scoped>
/* 图表容器样式 */
</style>
