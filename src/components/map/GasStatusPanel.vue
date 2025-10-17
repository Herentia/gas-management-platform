<template>
  <div class="gas-status-panel">
    <!-- 搜索框 -->
    <div class="search-section">
      <el-input v-model="searchKeyword" placeholder="请输入关键词" clearable @clear="handleSearchClear"
        @keyup.enter="handleSearch" class="search-input">
        <template #suffix>
          <el-icon class="search-icon" @click="handleSearch">
            <Search />
          </el-icon>
        </template>
      </el-input>
    </div>

    <!-- 状态筛选 -->
    <div class="status-filter">
      <el-radio-group v-model="activeStatus" @change="handleStatusChange" class="status-radio-group">
        <el-radio-button label="all">全部({{ totalCount }})</el-radio-button>
        <el-radio-button label="normal">正常({{ normalCount }})</el-radio-button>
        <el-radio-button label="abnormal">异常({{ abnormalCount }})</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 设备列表 -->
    <div class="device-list">
      <div v-for="device in filteredDevices" :key="device.id" class="device-item"
        :class="{ 'abnormal': device.status === 'abnormal' }" @click="handleDeviceClick(device)">
        <div class="device-info">
          <span class="device-name">{{ device.name }}</span>
          <span class="device-status" :class="device.status">
            {{ device.status === 'normal' ? '正常' : '异常' }}
          </span>
        </div>
        <div class="device-pressure" v-if="device.pressure">
          压力: {{ device.pressure }} MPa
        </div>
        <div class="device-temp" v-if="device.temperature">
          温度: {{ device.temperature }} °C
        </div>
      </div>
    </div>

    <!-- 导出按钮 -->
    <div class="export-section">
      <el-button type="primary" :icon="Download" @click="handleExport" class="export-btn">
        导出
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, Download } from '@element-plus/icons-vue'
import { ref, computed } from 'vue'

interface GasDevice {
  id: string
  name: string
  status: 'normal' | 'abnormal'
  pressure: string
  temperature?: string
  coordinates: number[]
  data?: any // 设备详细信息
}

// Props
const props = defineProps<{
  data?: GasDevice[]
}>()

// Emits
const emit = defineEmits<{
  deviceClick: [device: GasDevice]
  search: [keyword: string]
  statusChange: [status: string]
  export: []
}>()

// 响应式数据
const searchKeyword = ref('')
const activeStatus = ref('all')

// 默认数据
const defaultDevices: GasDevice[] = [
  {
    id: 'FC1',
    name: 'FC1',
    status: 'normal',
    pressure: '0.85',
    temperature: '25.3',
    coordinates: [116.3974, 39.9093],
    data: {
      type: 'pressure_station',
      model: 'PCS-1000',
      installDate: '2023-01-15'
    }
  },
  {
    id: 'FC2',
    name: 'FC2',
    status: 'normal',
    pressure: '0.82',
    temperature: '24.8',
    coordinates: [116.4024, 39.9143],
    data: {
      type: 'pressure_station',
      model: 'PCS-1000',
      installDate: '2023-02-20'
    }
  },
  {
    id: 'FC3',
    name: 'FC3',
    status: 'normal',
    pressure: '0.88',
    temperature: '26.1',
    coordinates: [116.4074, 39.9193],
    data: {
      type: 'pressure_station',
      model: 'PCS-2000',
      installDate: '2023-01-10'
    }
  },
  {
    id: 'FC4',
    name: 'FC4',
    status: 'normal',
    pressure: '0.83',
    temperature: '25.6',
    coordinates: [116.4124, 39.9243],
    data: {
      type: 'pressure_station',
      model: 'PCS-1000',
      installDate: '2023-03-05'
    }
  },
  {
    id: 'FC5',
    name: 'FC5',
    status: 'abnormal',
    pressure: '1.25',
    temperature: '32.7',
    coordinates: [116.4174, 39.9293],
    data: {
      type: 'pressure_station',
      model: 'PCS-2000',
      installDate: '2023-01-25',
      alarm: '压力过高'
    }
  },
  {
    id: 'FC6',
    name: 'FC6',
    status: 'normal',
    pressure: '0.86',
    temperature: '25.9',
    coordinates: [116.4224, 39.9343],
    data: {
      type: 'pressure_station',
      model: 'PCS-1000',
      installDate: '2023-02-15'
    }
  }
]

// 使用传入的数据或默认数据
const gasStatusDevices = computed(() => props.data || defaultDevices)

// 计算属性
const filteredDevices = computed(() => {
  let devices = gasStatusDevices.value

  // 根据状态筛选
  if (activeStatus.value !== 'all') {
    devices = devices.filter(device => device.status === activeStatus.value)
  }

  // 根据关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    devices = devices.filter(device =>
      device.name.toLowerCase().includes(keyword) ||
      device.pressure.includes(keyword) ||
      (device.temperature && device.temperature.includes(keyword))
    )
  }

  return devices
})

const totalCount = computed(() => gasStatusDevices.value.length)
const normalCount = computed(() => gasStatusDevices.value.filter(d => d.status === 'normal').length)
const abnormalCount = computed(() => gasStatusDevices.value.filter(d => d.status === 'abnormal').length)

// 事件处理函数
const handleSearch = () => {
  console.log('搜索关键词:', searchKeyword.value)
  emit('search', searchKeyword.value)
}

const handleSearchClear = () => {
  console.log('清除搜索')
  searchKeyword.value = ''
  emit('search', '')
}

const handleStatusChange = (status: string) => {
  console.log('状态筛选:', status)
  emit('statusChange', status)
}

const handleDeviceClick = (device: GasDevice) => {
  console.log('点击设备:', device)
  emit('deviceClick', device)
}

const handleExport = () => {
  console.log('导出气源压力数据')
  emit('export')
}
</script>

<style scoped>
.gas-status-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 16px;
}

/* 搜索区域 */
.search-section {
  margin-bottom: 8px;
}

.search-input {
  width: 100%;
}

.search-icon {
  cursor: pointer;
  color: var(--el-color-primary);
}

:deep(.search-input .el-input__wrapper) {
  border-radius: 6px;
}

/* 状态筛选 */
.status-filter {
  margin-bottom: 8px;
}

.status-radio-group {
  width: 100%;
}

:deep(.status-radio-group .el-radio-button) {
  flex: 1;
}

:deep(.status-radio-group .el-radio-button__inner) {
  width: 100%;
  text-align: center;
}

/* 设备列表 */
.device-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* max-height: 300px; */
}

.device-item {
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.device-item:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(30, 111, 186, 0.1);
  transform: translateY(-1px);
}

.device-item.abnormal {
  border-color: #f56c6c;
  background: linear-gradient(135deg, #fef0f0 0%, #fff6f6 100%);
}

.device-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.device-name {
  font-weight: 600;
  color: #333;
}

.device-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.device-status.normal {
  background: #f0f9ff;
  color: var(--el-color-primary);
  border: 1px solid #b8d9f5;
}

.device-status.abnormal {
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fbc4c4;
}

.device-pressure,
.device-temp {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

/* 导出区域 */
.export-section {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.export-btn {
  width: 100%;
}

/* 滚动条样式 */
.device-list::-webkit-scrollbar {
  width: 4px;
}

.device-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.device-list::-webkit-scrollbar-thumb {
  background: #b8d9f5;
  border-radius: 2px;
}

.device-list::-webkit-scrollbar-thumb:hover {
  background: var(--el-color-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gas-status-panel {
    padding: 12px;
  }
}
</style>
