<!-- src/components/map/TerminalEquipmentPanel.vue -->
<template>
  <div class="terminal-equipment-panel">
    <!-- 状态统计 -->
    <div class="status-statistics">
      <div class="status-item normal" @click="filterStatus('正常')">
        <div class="status-count">{{ statusCount.normal }}</div>
        <div class="status-label">正常</div>
      </div>
      <div class="status-item alarm" @click="filterStatus('报警')">
        <div class="status-count">{{ statusCount.alarm }}</div>
        <div class="status-label">报警</div>
      </div>
      <div class="status-item offline" @click="filterStatus('离线')">
        <div class="status-count">{{ statusCount.offline }}</div>
        <div class="status-label">离线</div>
      </div>
      <div class="status-item maintenance" @click="filterStatus('维护中')">
        <div class="status-count">{{ statusCount.maintenance }}</div>
        <div class="status-label">维护中</div>
      </div>
    </div>

    <!-- 设备搜索 -->
    <div class="search-container">
      <el-input v-model="searchKeyword" placeholder="搜索设备..." :prefix-icon="Search" size="small" clearable
        @input="handleSearch" />
    </div>

    <!-- 设备列表 -->
    <div class="device-list">
      <div v-for="device in filteredDevices" :key="device.id" class="device-item" :class="{
        'device-alarm': device.status === '低压报警',
        'device-offline': device.status === '离线',
        'device-maintenance': device.status === '维护中'
      }" @click="handleDeviceClick(device)">
        <div class="device-header">
          <div class="device-name">{{ device.name }}</div>
          <div class="device-status" :class="getStatusClass(device.status)">
            {{ device.status }}
          </div>
        </div>

        <div class="device-location">{{ device.location }}</div>

        <div class="device-data">
          <template v-if="device.status !== '离线' && device.status !== '维护中'">
            <div v-if="device.type === '燃气表'" class="data-item">
              <span class="data-label">压力</span>
              <span class="data-value">{{ device.pressure }}</span>
            </div>
            <div v-if="device.type === '燃气表' || device.type === '流量传感器'" class="data-item">
              <span class="data-label">流量</span>
              <span class="data-value">{{ device.flow || '-' }}</span>
            </div>
            <div class="data-item">
              <span class="data-label">信号</span>
              <span class="data-value">{{ device.signal }}</span>
            </div>
          </template>

          <template v-else-if="device.status === '离线'">
            <div class="data-item">
              <span class="data-label">最后在线</span>
              <span class="data-value">{{ device.lastOnline }}</span>
            </div>
            <div class="data-item">
              <span class="data-label">流量</span>
              <span class="data-value">{{ device.flow || '-' }}</span>
            </div>
            <div class="data-item">
              <span class="data-label">信号</span>
              <span class="data-value">{{ device.signal || '-' }}</span>
            </div>
          </template>

          <template v-else-if="device.status === '维护中'">
            <div class="data-item">
              <span class="data-label">状态</span>
              <span class="data-value">{{ device.valveStatus || '关闭' }}</span>
            </div>
            <div class="data-item">
              <span class="data-label">维护人员</span>
              <span class="data-value">{{ device.maintainer || '添加提醒' }}</span>
            </div>
            <div class="data-item">
              <span class="data-label">预计完成</span>
              <span class="data-value">{{ device.estimatedCompletion || '1小时内' }}</span>
            </div>
          </template>
        </div>

        <div v-if="device.temperature" class="device-temperature">
          <span class="data-label">温度</span>
          <span class="data-value">{{ device.temperature }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface Device {
  id: string
  name: string
  type: string
  status: string
  location: string
  pressure?: string
  flow?: string
  signal?: string
  temperature?: string
  lastOnline?: string
  valveStatus?: string
  maintainer?: string
  estimatedCompletion?: string
  coordinates?: number[]
}

const searchKeyword = ref('')
const currentStatusFilter = ref<string | null>(null)

// 模拟设备数据
const devices = ref<Device[]>([
  {
    id: '1',
    name: '燃气表-G1.6-001256',
    type: '燃气表',
    status: '正常',
    location: '阳光花园小区3号楼',
    pressure: '2.3 kPa',
    flow: '0.0 m³/h',
    signal: '-75 dBm',
    coordinates: [116.3974, 39.9093]
  },
  {
    id: '2',
    name: '压力传感器-P200-003698',
    type: '压力传感器',
    status: '低压报警',
    location: '城东片区主管道',
    pressure: '0.8 kPa',
    temperature: '25.3 °C',
    signal: '-68 dBm',
    coordinates: [116.4074, 39.9193]
  },
  {
    id: '3',
    name: '流量传感器-F300-002587',
    type: '流量传感器',
    status: '离线',
    location: '城西工业区',
    lastOnline: '2小时前',
    flow: '-',
    signal: '-',
    coordinates: [116.4174, 39.9093]
  },
  {
    id: '4',
    name: '阀门控制器-V500-001896',
    type: '阀门控制器',
    status: '维护中',
    location: '城北片区阀门站',
    valveStatus: '关闭',
    maintainer: '添加提醒',
    estimatedCompletion: '1小时内',
    coordinates: [116.4024, 39.9143]
  },
  {
    id: '5',
    name: '燃气表-G2.5-001257',
    type: '燃气表',
    status: '正常',
    location: '阳光花园小区4号楼',
    pressure: '2.1 kPa',
    flow: '0.2 m³/h',
    signal: '-72 dBm',
    coordinates: [116.3975, 39.9094]
  },
  {
    id: '6',
    name: '压力传感器-P200-003699',
    type: '压力传感器',
    status: '正常',
    location: '城南片区主管道',
    pressure: '2.5 kPa',
    temperature: '23.8 °C',
    signal: '-65 dBm',
    coordinates: [116.3976, 39.9095]
  }
])

// 状态统计
const statusCount = computed(() => {
  return {
    normal: devices.value.filter(d => d.status === '正常').length,
    alarm: devices.value.filter(d => d.status === '低压报警').length,
    offline: devices.value.filter(d => d.status === '离线').length,
    maintenance: devices.value.filter(d => d.status === '维护中').length
  }
})

// 过滤后的设备列表
const filteredDevices = computed(() => {
  let filtered = devices.value

  // 按状态过滤
  if (currentStatusFilter.value) {
    filtered = filtered.filter(device => device.status === currentStatusFilter.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(device =>
      device.name.toLowerCase().includes(keyword) ||
      device.location.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    '正常': 'status-normal',
    '低压报警': 'status-alarm',
    '离线': 'status-offline',
    '维护中': 'status-maintenance'
  }
  return classMap[status] || ''
}

const filterStatus = (status: string) => {
  if (currentStatusFilter.value === status) {
    currentStatusFilter.value = null
  } else {
    currentStatusFilter.value = status
  }
}

const handleSearch = () => {
  // 搜索逻辑已包含在 computed 中
}

const emit = defineEmits<{
  deviceClick: [device: Device]
}>()

// 注意：事件名要使用驼峰命名
const handleDeviceClick = (device: Device) => {
  console.log('设备点击:', device)
  ElMessage.info(`点击设备: ${device.name}`)

  // 触发设备点击事件 - 使用驼峰命名
  emit('deviceClick', device)
}

// 暴露方法给父组件
defineExpose({
  refreshData: () => {
    // 模拟刷新数据
    console.log('刷新终端设备数据')
  }
})
</script>

<style scoped>
.terminal-equipment-panel {
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.status-statistics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
}

.status-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.status-item.normal {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-color: #bae6fd;
}

.status-item.alarm {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-color: #fecaca;
}

.status-item.offline {
  background: linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%);
  border-color: #d4d4d4;
}

.status-item.maintenance {
  background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
  border-color: #fde047;
}

.status-count {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 4px;
}

.status-item.normal .status-count {
  color: #0ea5e9;
}

.status-item.alarm .status-count {
  color: #ef4444;
}

.status-item.offline .status-count {
  color: #6b7280;
}

.status-item.maintenance .status-count {
  color: #eab308;
}

.status-label {
  font-size: 12px;
  color: #6b7280;
}

.search-container {
  margin-bottom: 16px;
}

.device-list {
  flex: 1;
  overflow-y: auto;
}

.device-item {
  padding: 12px;
  margin-bottom: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.device-item:hover {
  border-color: #1E6FBA;
  box-shadow: 0 4px 12px rgba(30, 111, 186, 0.1);
  transform: translateX(2px);
}

.device-alarm {
  border-left: 4px solid #ef4444;
}

.device-offline {
  border-left: 4px solid #6b7280;
}

.device-maintenance {
  border-left: 4px solid #eab308;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.device-name {
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
  flex: 1;
}

.device-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.status-normal {
  background: #d1fae5;
  color: #065f46;
}

.status-alarm {
  background: #fee2e2;
  color: #991b1b;
}

.status-offline {
  background: #f3f4f6;
  color: #4b5563;
}

.status-maintenance {
  background: #fef3c7;
  color: #92400e;
}

.device-location {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 12px;
}

.device-data {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.data-item {
  display: flex;
  flex-direction: column;
}

.data-label {
  font-size: 10px;
  color: #9ca3af;
  margin-bottom: 2px;
}

.data-value {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.device-temperature {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

/* 滚动条样式 */
.device-list::-webkit-scrollbar {
  width: 6px;
}

.device-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.device-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.device-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
