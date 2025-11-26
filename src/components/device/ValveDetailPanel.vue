<!-- components/device/ValveDetailPanel.vue -->
<template>
  <div class="valve-detail-panel">
    <!-- 设备状态指示 -->
    <div class="status-indicator">
      <div class="status-dot" :class="valveData.status"></div>
      <span class="status-text">{{ getStatusText(valveData.status) }}</span>
    </div>

    <!-- 设备基本信息 -->
    <div class="device-info">
      <h3 class="device-name">{{ valveData.name }}</h3>
      <p class="device-spec">{{ valveData.specification }}</p>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">安装日期</span>
          <span class="info-value">{{ valveData.installationDate }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">上次检修</span>
          <span class="info-value">{{ valveData.lastMaintenance }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">坐标位置</span>
          <span class="info-value">{{ valveData.coordinates }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">连接管线</span>
          <span class="info-value">{{ valveData.connectedPipelines }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">状态</span>
          <span class="info-value">{{ valveData.connectedPipelines }}</span>
        </div>
      </div>
    </div>

    <!-- 导航按钮 -->
    <div class="navigation-section">
      <el-button
        type="primary"
        @click="handleNavigate"
        class="navigate-btn"
        :loading="navigating">
        导航至该位置
      </el-button>
    </div>

    <!-- 导航路线信息 -->
    <div v-if="showNavigation" class="navigation-info">
      <div class="navigation-header">
        <h4>导航路线</h4>
      </div>

      <div class="destination-info">
        <div class="destination-title">目的地</div>
        <div class="destination-detail">{{ valveData.name }} ({{ valveData.coordinates }})</div>
      </div>

      <div class="current-location">
        <div class="location-title">当前位置</div>
        <div class="location-detail">{{ currentLocation }}</div>
      </div>

      <div class="route-summary">
        <div class="route-item">
          <div class="route-label">距离</div>
          <div class="route-value">{{ routeInfo.distance }}</div>
        </div>
        <div class="route-item">
          <div class="route-label">预计时间</div>
          <div class="route-value">{{ routeInfo.duration }}</div>
        </div>
        <div class="route-item">
          <div class="route-label">路线类型</div>
          <div class="route-value">{{ routeInfo.type }}</div>
        </div>
      </div>

      <div class="route-guide">
        <div class="guide-title">路线指引</div>
        <div class="guide-steps">
          <div
            v-for="(step, index) in routeInfo.steps"
            :key="index"
            class="guide-step">
            <span class="step-number">{{ index + 1 }}</span>
            <span class="step-content">{{ step }}</span>
          </div>
        </div>
      </div>

      <el-button
        type="default"
        @click="openExternalMap"
        class="external-map-btn">
        在外部地图打开
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface ValveData {
  id: string
  name: string
  specification: string
  installationDate: string
  lastMaintenance: string
  coordinates: string
  connectedPipelines: string
  status: 'normal' | 'warning' | 'error'
}

interface RouteInfo {
  distance: string
  duration: string
  type: string
  steps: string[]
}

interface Props {
  valveData: ValveData
}

const props = defineProps<Props>()
const emit = defineEmits(['navigate'])

const navigating = ref(false)
const showNavigation = ref(false)
const currentLocation = ref('自动获取中...')

const routeInfo = ref<RouteInfo>({
  distance: '3.2 公里',
  duration: '15 分钟',
  type: '驾车',
  steps: [
    '从当前位置出发，沿XX路向东行驶500米',
    '右转进入XX大街，行驶1.2公里',
    '左转进入XX巷，行驶800米',
    '到达目的地附近，阀门位于道路北侧绿化带内'
  ]
})

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'normal': '正常运行',
    'warning': '警告',
    'error': '故障'
  }
  return statusMap[status] || '未知状态'
}

const handleNavigate = async () => {
  navigating.value = true
  showNavigation.value = true

  // 模拟获取当前位置
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    currentLocation.value = '北京市朝阳区建国路88号'
    emit('navigate', props.valveData)
  } catch (error) {
    console.error('获取位置失败:', error)
    currentLocation.value = '获取失败，请检查定位权限'
  } finally {
    navigating.value = false
  }
}

const openExternalMap = () => {
  // 这里可以集成百度地图、高德地图等外部地图服务
  const [lat, lng] = props.valveData.coordinates.split(',').map(coord =>
    parseFloat(coord.replace('°', '').trim())
  )
  const url = `https://uri.amap.com/navigation?to=${lng},${lat},${props.valveData.name}&mode=car`
  window.open(url, '_blank')
}

onMounted(() => {
  // 组件挂载时尝试获取当前位置
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        currentLocation.value = `纬度: ${latitude.toFixed(6)}, 经度: ${longitude.toFixed(6)}`
      },
      (error) => {
        console.error('获取当前位置失败:', error)
        currentLocation.value = '自动获取失败，使用默认位置'
      }
    )
  }
})
</script>

<style scoped>
.valve-detail-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.status-indicator {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-dot.normal {
  background: #52c41a;
}

.status-dot.warning {
  background: #faad14;
}

.status-dot.error {
  background: #ff4d4f;
}

.status-text {
  font-size: 14px;
  font-weight: 500;
}

.device-info {
  margin-bottom: 16px;
}

.device-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1f2937;
}

.device-spec {
  color: #6b7280;
  margin: 0 0 16px 0;
  font-size: 14px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.info-label {
  color: #6b7280;
  font-size: 13px;
  flex-shrink: 0;
  margin-right: 12px;
}

.info-value {
  color: #1f2937;
  font-size: 13px;
  font-weight: 500;
  text-align: right;
  flex: 1;
}

.navigation-section {
  margin: 16px 0;
}

.navigate-btn {
  width: 100%;
}

.navigation-info {
  margin-top: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.navigation-header h4 {
  margin: 0 0 12px 0;
  color: #1f2937;
  font-size: 16px;
}

.destination-info,
.current-location {
  margin-bottom: 12px;
}

.destination-title,
.location-title {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.destination-detail,
.location-detail {
  font-size: 13px;
  color: #1f2937;
  font-weight: 500;
}

.route-summary {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin: 16px 0;
  padding: 12px;
  background: white;
  border-radius: 6px;
}

.route-item {
  text-align: center;
}

.route-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.route-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e6fba;
}

.route-guide {
  margin: 16px 0;
}

.guide-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1f2937;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.guide-step {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  line-height: 1.4;
}

.step-number {
  background: #1e6fba;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
  margin-top: 1px;
}

.step-content {
  color: #374151;
}

.external-map-btn {
  width: 100%;
  margin-top: 12px;
}
</style>
