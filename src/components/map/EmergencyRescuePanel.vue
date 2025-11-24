<!-- components/map/EmergencyRescuePanel.vue -->
<template>
  <div class="emergency-rescue-panel">
    <!-- 漏点定位标题 -->
    <div class="section-header">
      <h3>漏点定位</h3>
    </div>

    <!-- 定位方式 -->
    <div class="location-method-section">
      <div class="section-title">定位方式</div>
      <div class="method-buttons">
        <el-button
          :type="locationMethod === 'manual' ? 'primary' : ''"
          @click="locationMethod = 'manual'"
          class="method-btn">
          手动输入
        </el-button>
        <el-button
          :type="locationMethod === 'gps' ? 'primary' : ''"
          @click="handleGPSGet"
          class="method-btn">
          GPS获取
        </el-button>
      </div>
    </div>

    <!-- 坐标输入 -->
    <div class="coordinate-section">
      <div class="coordinate-row">
        <div class="coordinate-item">
          <div class="coordinate-label">纬度</div>
          <el-input
            v-model="latitude"
            placeholder="例如：39.908"
            :disabled="locationMethod === 'gps'"
            @input="handleCoordinateInput"
            class="coordinate-input"
          />
        </div>
        <div class="coordinate-item">
          <div class="coordinate-label">经度</div>
          <el-input
            v-model="longitude"
            placeholder="例如：116.39"
            :disabled="locationMethod === 'gps'"
            @input="handleCoordinateInput"
            class="coordinate-input"
          />
        </div>
      </div>
    </div>

    <!-- 漏点描述 -->
    <div class="description-section">
      <div class="section-title">漏点描述</div>
      <el-input
        v-model="leakDescription"
        type="textarea"
        :rows="3"
        placeholder="例如：主管道破裂，泄漏严重..."
        @input="handleLeakDescribe"
        class="description-input"
      />
    </div>

    <!-- 分隔线 -->
    <div class="divider"></div>

    <!-- 定位漏点按钮 -->
    <div class="action-section">
      <el-button
        type="primary"
        @click="handleLocateLeak"
        :disabled="!isCoordinatesValid"
        class="locate-btn">
        定位漏点
      </el-button>
    </div>

    <!-- 影响分析 -->
    <div class="analysis-section">
      <div class="section-title">影响分析</div>
      <el-button
        type="warning"
        @click="handleAnalyzeImpact"
        :disabled="!currentLeakData"
        class="analysis-btn">
        分析影响区域
      </el-button>
    </div>

    <!-- 分隔线 -->
    <div class="divider"></div>

    <!-- 抢险记录 -->
    <div class="rescue-records-section">
      <div class="section-title">抢险记录</div>
      <div class="records-list">
        <div
          v-for="(record, index) in rescueRecords"
          :key="index"
          class="record-item">
          <div class="record-header">
            <span class="record-title">{{ record.title }}</span>
            <span class="record-time">{{ record.time }}</span>
          </div>
          <div class="record-location">地点：{{ record.location }}</div>
          <div class="record-status" :class="getStatusClass(record.status)">
            {{ record.status }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, watch } from 'vue'

interface LeakData {
  latitude: string
  longitude: string
  description: string
  locationMethod: 'manual' | 'gps'
}

interface RescueRecord {
  title: string
  time: string
  location: string
  status: string
}

const props = defineProps<{
  leakData?: LeakData | null
  rescueRecords?: RescueRecord[]
}>()

const emit = defineEmits([
  'location-method-change',
  'coordinate-input',
  'gps-get',
  'leak-describe',
  'locate-leak',
  'analyze-impact'
])

// 响应式数据
const locationMethod = ref<'manual' | 'gps'>('manual')
const latitude = ref('')
const longitude = ref('')
const leakDescription = ref('')

// 计算属性
const isCoordinatesValid = computed(() => {
  return latitude.value.trim() !== '' && longitude.value.trim() !== ''
})

const currentLeakData = computed(() => props.leakData)

// 监听外部数据变化
watch(() => props.leakData, (newData) => {
  if (newData) {
    locationMethod.value = newData.locationMethod
    latitude.value = newData.latitude
    longitude.value = newData.longitude
    leakDescription.value = newData.description
  }
})

// 处理方法
const handleLocationMethodChange = (method: 'manual' | 'gps') => {
  locationMethod.value = method
  emit('location-method-change', method)
}

const handleCoordinateInput = () => {
  emit('coordinate-input', {
    latitude: latitude.value,
    longitude: longitude.value
  })
}

const handleGPSGet = () => {
  // 模拟GPS获取坐标
  locationMethod.value = 'gps'
  latitude.value = '39.9087'
  longitude.value = '116.3974'

  emit('gps-get', {
    latitude: latitude.value,
    longitude: longitude.value
  })
  emit('location-method-change', 'gps')
}

const handleLeakDescribe = () => {
  emit('leak-describe', leakDescription.value)
}

const handleLocateLeak = () => {
  const leakData: LeakData = {
    latitude: latitude.value,
    longitude: longitude.value,
    description: leakDescription.value,
    locationMethod: locationMethod.value
  }
  emit('locate-leak', leakData)
}

const handleAnalyzeImpact = () => {
  if (currentLeakData.value) {
    emit('analyze-impact', currentLeakData.value)
  }
}

const getStatusClass = (status: string) => {
  return status === '已处理' ? 'status-resolved' : 'status-pending'
}
</script>

<style scoped>
.emergency-rescue-panel {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.section-header {
  text-align: center;
  margin-bottom: 8px;
}

.section-header h3 {
  margin: 0;
  color: #1E6FBA;
  font-size: 16px;
  font-weight: 600;
}

.section-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #1E6FBA;
  font-size: 14px;
}

.method-buttons {
  display: flex;
  gap: 8px;
}

.method-btn {
  flex: 1;
}

.coordinate-section {
  margin-bottom: 8px;
}

.coordinate-row {
  display: flex;
  gap: 12px;
}

.coordinate-item {
  flex: 1;
}

.coordinate-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 4px;
}

.coordinate-input {
  width: 100%;
}

.description-input {
  width: 100%;
}

.divider {
  height: 1px;
  background: #e5e7eb;
  margin: 8px 0;
}

.action-section,
.analysis-section {
  text-align: center;
}

.locate-btn,
.analysis-btn {
  width: 100%;
}

.records-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px;
  background: white;
}

.record-item {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
  border-radius: 4px;
  margin-bottom: 8px;
}

.record-item:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.record-title {
  font-weight: 600;
  color: #334155;
  font-size: 13px;
}

.record-time {
  color: #64748b;
  font-size: 11px;
}

.record-location {
  color: #475569;
  font-size: 12px;
  margin-bottom: 4px;
}

.record-status {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 10px;
  display: inline-block;
}

.status-resolved {
  background: #dcfce7;
  color: #166534;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}
</style>
