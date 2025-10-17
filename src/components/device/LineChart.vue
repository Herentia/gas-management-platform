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
  height: 180
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
      },
      confine: true,
      textStyle: {
        fontSize: 11
      }
    },
    legend: {
      data: ['温度', '压力'],
      top: 5,
      right: 10,
      textStyle: {
        fontSize: 10
      },
      itemWidth: 10,
      itemHeight: 6,
      itemGap: 8
    },
    grid: {
      left: '8%',
      right: '8%',
      bottom: '8%',
      top: '20%',
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
      },
      axisLabel: {
        fontSize: 9,
        color: '#666'
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '°C',
        position: 'left',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#ff6b6b'
          }
        },
        axisLabel: {
          fontSize: 9,
          formatter: '{value}',
          color: '#666'
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed'
          }
        },
        max: 100,
        nameTextStyle: {
          fontSize: 9,
          color: '#666'
        }
      },
      {
        type: 'value',
        name: 'kPa',
        position: 'right',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#4ecdc4'
          }
        },
        axisLabel: {
          fontSize: 9,
          formatter: '{value}',
          color: '#666'
        },
        splitLine: {
          show: false
        },
        max: 100,
        nameTextStyle: {
          fontSize: 9,
          color: '#666'
        }
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
          width: 2
        },
        itemStyle: {
          color: '#ff6b6b'
        },
        symbol: 'circle',
        symbolSize: 4,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 107, 107, 0.3)' },
            { offset: 1, color: 'rgba(255, 107, 107, 0.05)' }
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
          width: 2
        },
        itemStyle: {
          color: '#4ecdc4'
        },
        symbol: 'circle',
        symbolSize: 4,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(78, 205, 196, 0.3)' },
            { offset: 1, color: 'rgba(78, 205, 196, 0.05)' }
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
