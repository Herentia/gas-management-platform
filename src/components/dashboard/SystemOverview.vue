<template>
  <div class="system-overview">
    <h2 class="responsive-heading mb-6 text-gray-800">系统概览</h2>

    <div class="overview-grid">
      <!-- 设备状态统计 -->
      <div class="overview-card">
        <h3 class="card-title">设备状态统计</h3>
        <div class="chart-container">
          <canvas id="deviceStatusChart" ref="deviceStatusChart"></canvas>
        </div>
      </div>

      <!-- 今日巡检情况 -->
      <div class="overview-card">
        <h3 class="card-title">今日巡检情况</h3>
        <div class="chart-container">
          <canvas id="inspectionChart" ref="inspectionChart"></canvas>
        </div>
      </div>

      <!-- 告警统计 -->
      <div class="overview-card">
        <h3 class="card-title">最近告警</h3>
        <AlertList :alerts="recentAlerts" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Chart from 'chart.js/auto'
import type { AlertItem } from '@/types'
import AlertList from '@/components/dashboard/AlertList.vue'

const deviceStatusChart = ref<HTMLCanvasElement>()
const inspectionChart = ref<HTMLCanvasElement>()

const recentAlerts = ref<AlertItem[]>([
  {
    type: 'danger',
    title: '调压箱压力过高',
    location: '城东片区',
    time: '10:23'
  },
  {
    type: 'warning',
    title: '工程进度滞后',
    location: '南部新区管网',
    time: '09:15'
  },
  {
    type: 'danger',
    title: '流量计异常',
    location: '工业园区',
    time: '08:47'
  }
])

onMounted(() => {
  initCharts()
})

const initCharts = () => {
  // 设备状态统计图表
  if (deviceStatusChart.value) {
    new Chart(deviceStatusChart.value, {
      type: 'doughnut',
      data: {
        labels: ['正常', '异常', '维护中'],
        datasets: [{
          data: [75, 10, 15],
          backgroundColor: ['#00B42A', '#F53F3F', '#FF7D00'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        cutout: '70%'
      }
    })
  }

  // 巡检情况图表
  if (inspectionChart.value) {
    new Chart(inspectionChart.value, {
      type: 'bar',
      data: {
        labels: ['市政管网', '庭院管网', '入户安检', '设备设施'],
        datasets: [{
          label: '已完成',
          data: [8, 5, 12, 4],
          backgroundColor: '#165DFF'
        }, {
          label: '未完成',
          data: [2, 3, 3, 1],
          backgroundColor: '#86909C'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          x: {
            stacked: true
          },
          y: {
            stacked: true,
            beginAtZero: true
          }
        }
      }
    })
  }
}
</script>

<style scoped>
.system-overview {
  margin-top: 2.5rem;
}

.overview-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .overview-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.overview-card {
  background-color: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 1rem;
}

.chart-container {
  height: 200px;
  position: relative;
}
</style>
