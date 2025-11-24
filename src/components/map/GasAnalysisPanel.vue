<!-- components/map/GasAnalysisPanel.vue -->
<template>
  <div class="gas-analysis-panel">
    <!-- 阀门搜索区域 -->
    <div class="search-section">
      <div class="section-title">阀门名称</div>
      <el-input
        v-model="valveSearchText"
        placeholder="输入阀门标识或名称"
        clearable
        @keyup.enter="handleSearch"
        class="search-input">
        <template #append>
          <el-button @click="handleSearch" :icon="Search">搜索</el-button>
        </template>
      </el-input>
      <el-button
        type="primary"
        @click="handleLocate"
        :disabled="!currentValve"
        class="locate-btn">
        定位到地图
      </el-button>
    </div>

    <!-- 影响分析区域 -->
    <div class="analysis-section">
      <div class="section-title">影响分析</div>
      <el-button
        type="warning"
        @click="handleAnalysis"
        :disabled="!currentValve"
        :loading="analyzing"
        class="analysis-btn">
        智能分析影响范围
      </el-button>

      <!-- 分析结果 -->
      <div v-if="analysisResult" class="analysis-result">
        <div class="result-grid">
          <div class="result-item">
            <div class="result-label">影响用户数</div>
            <div class="result-value">{{ analysisResult.affectedUsers }} 户</div>
          </div>
          <div class="result-item">
            <div class="result-label">影响区域</div>
            <div class="result-value">约 {{ analysisResult.affectedArea }} 平方公里</div>
          </div>
          <div class="result-item">
            <div class="result-label">影响管线长度</div>
            <div class="result-value">{{ analysisResult.affectedPipelineLength }} 公里</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预计停气时间 -->
    <div class="time-section">
      <div class="section-title">预计停气时间</div>
      <div class="time-selection">
        <el-date-picker
          v-model="shutdownStartTime"
          type="datetime"
          placeholder="开始时间"
          style="width: 100%; margin-bottom: 8px;"
        />
        <el-date-picker
          v-model="shutdownEndTime"
          type="datetime"
          placeholder="结束时间"
          style="width: 100%;"
        />
      </div>
    </div>

    <!-- 生成停气通知 -->
    <div class="notice-section">
      <el-button
        type="success"
        @click="handleGenerateNotice"
        :disabled="!analysisResult || !shutdownStartTime || !shutdownEndTime"
        class="notice-btn">
        生成停气通知
      </el-button>
    </div>

    <!-- 操作记录 -->
    <div class="record-section">
      <div class="section-title">操作记录</div>
      <div class="record-list">
        <div
          v-for="(record, index) in operationRecords"
          :key="index"
          class="record-item">
          <div class="record-content">
            <div class="record-action">{{ record.action }}</div>
            <div class="record-time">{{ record.time }}</div>
            <div v-if="record.details" class="record-details">
              {{ record.details }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'

interface ValveData {
  id: string
  name: string
  coordinates?: [number, number]
  type?: string
  status?: string
}

interface AnalysisResult {
  affectedUsers: number
  affectedArea: number
  affectedPipelineLength: number
}

interface OperationRecord {
  action: string
  time: string
  details?: string
}

const props = defineProps<{
  valveData?: ValveData | null
  analysisResult?: AnalysisResult | null
  operationRecords?: OperationRecord[]
}>()

const emit = defineEmits([
  'valve-search',
  'valve-locate',
  'impact-analysis',
  'generate-notice'
])

const valveSearchText = ref('')
const analyzing = ref(false)
const shutdownStartTime = ref<Date | null>(null)
const shutdownEndTime = ref<Date | null>(null)

const currentValve = computed(() => props.valveData)

// 监听外部传入的阀门数据变化
watch(() => props.valveData, (newValve) => {
  if (newValve) {
    valveSearchText.value = newValve.name
  }
})

const handleSearch = () => {
  if (valveSearchText.value.trim()) {
    emit('valve-search', valveSearchText.value.trim())
  }
}

const handleLocate = () => {
  if (currentValve.value) {
    emit('valve-locate', currentValve.value)
  }
}

const handleAnalysis = async () => {
  if (currentValve.value) {
    analyzing.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)) // 模拟分析过程
      emit('impact-analysis', currentValve.value)
    } finally {
      analyzing.value = false
    }
  }
}

const handleGenerateNotice = () => {
  if (currentValve.value && shutdownStartTime.value && shutdownEndTime.value) {
    emit('generate-notice', {
      valve: currentValve.value,
      startTime: shutdownStartTime.value,
      endTime: shutdownEndTime.value,
      analysisResult: props.analysisResult
    })
  }
}
</script>

<style scoped>
.gas-analysis-panel {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.section-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #1E6FBA;
  font-size: 14px;
}

.search-input {
  margin-bottom: 12px;
}

.locate-btn {
  width: 100%;
}

.analysis-btn {
  width: 100%;
  margin-bottom: 16px;
}

.analysis-result {
  background: #f8fafc;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #e5e7eb;
}

.result-grid {
  display: grid;
  gap: 8px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.result-label {
  color: #64748b;
  font-size: 13px;
}

.result-value {
  font-weight: 600;
  color: #1E6FBA;
}

.time-selection {
  display: flex;
  flex-direction: column;
}

.notice-btn {
  width: 100%;
}

.record-section {
  flex: 1;
  min-height: 0;
}

.record-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px;
  background: white;
}

.record-item {
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.record-item:last-child {
  border-bottom: none;
}

.record-content {
  font-size: 12px;
}

.record-action {
  font-weight: 500;
  color: #334155;
}

.record-time {
  color: #64748b;
  font-size: 11px;
  margin-top: 2px;
}

.record-details {
  color: #475569;
  margin-top: 2px;
  font-style: italic;
}
</style>
