<template>
  <div class="safety-inspection-map">
    <!-- 状态百分比展示 -->
    <div class="status-summary">
      <div class="status-item" v-for="item in statusSummary" :key="item.status">
        <span class="status-dot" :style="{ backgroundColor: item.color }"></span>
        <span class="status-text">{{ item.status }}</span>
        <span class="status-percentage">{{ item.percentage }}</span>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="search-section">
      <el-input v-model="searchText" placeholder="Q 搜索区域..." size="large" :prefix-icon="Search" clearable
        @input="handleSearch" />
    </div>

    <!-- 区域列表 -->
    <div class="area-list">
      <div class="area-item" v-for="area in filteredAreas" :key="area.id" @click="handleAreaClick(area)"
        :class="{ 'area-item-active': activeAreaId === area.id }">
        <div class="area-info">
          <div class="area-header">
            <h3 class="area-name">{{ area.name }}</h3>
            <div class="area-tags">
              <el-tag size="small" type="info">{{ area.region }}</el-tag>
              <el-tag size="small" type="info">{{ area.type }}</el-tag>
              <el-tag size="small" type="info">{{ area.buildingInfo }}</el-tag>
            </div>
          </div>

          <div class="area-stats">
            <div class="stat-row">
              <div class="stat-item">
                <div class="stat-label">{{ area.stats.total.label }}</div>
                <div class="stat-value">{{ area.stats.total.value }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">{{ area.stats.completed.label }}</div>
                <div class="stat-value" style="color: #52c41a">{{ area.stats.completed.value }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">{{ area.stats.pending.label }}</div>
                <div class="stat-value" :style="{ color: getPendingColor(area.stats.pending.status) }">
                  {{ area.stats.pending.value }}
                </div>
              </div>
            </div>

            <!-- 进度条显示 -->
            <div class="progress-section">
              <div class="progress-container">
                <div class="progress-circle">
                  <el-progress type="circle" :percentage="area.progress.percentage" :width="70" :stroke-width="8"
                    :color="getProgressColor(area.progress.percentage)" />
                </div>
                <div class="progress-details">
                  <div class="progress-title">安检进度</div>
                  <div class="progress-subtitle">{{ area.progress.completed }}/{{ area.progress.total }}</div>
                  <div class="progress-time" v-if="area.progress.lastInspection">
                    上次安检: {{ area.progress.lastInspection }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="area-actions">
          <el-button size="small" type="primary" link @click.stop="handleAssignTask(area)">
            分配任务
          </el-button>
          <el-button size="small" type="info" link @click.stop="handleViewDetails(area)">
            查看详情
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 状态百分比数据
const statusSummary = ref([
  { status: '已完成', percentage: '78.5%', color: '#52c41a' },
  { status: '进行中', percentage: '14.7%', color: '#1890ff' },
  { status: '超期未检', percentage: '6.8%', color: '#ff4d4f' }
])

// 搜索文本
const searchText = ref('')

// 当前激活的区域ID
const activeAreaId = ref<string>('')

// 区域数据
const areas = ref([
  {
    id: '1',
    name: '阳光花园小区',
    region: '城东区域',
    type: '居民小区',
    buildingInfo: '32栋楼',
    coordinates: [116.4074, 39.9193],
    stats: {
      total: { label: '总户数', value: '1,256' },
      completed: { label: '已安检', value: '1,005' },
      pending: { label: '未安检', value: '251', status: 'pending' }
    },
    progress: {
      percentage: 80,
      completed: 1005,
      total: 1256,
      lastInspection: '2024-01-15'
    }
  },
  {
    id: '2',
    name: '城西工业区',
    region: '城西区域',
    type: '工业园区',
    buildingInfo: '45家企业',
    coordinates: [116.3974, 39.9093],
    stats: {
      total: { label: '企业数', value: '45' },
      completed: { label: '已安检', value: '27' },
      pending: { label: '未安检', value: '18', status: 'pending' }
    },
    progress: {
      percentage: 60,
      completed: 27,
      total: 45,
      lastInspection: '2024-01-10'
    }
  },
  {
    id: '3',
    name: '城北老旧小区',
    region: '城北区域',
    type: '老旧小区',
    buildingInfo: '18栋楼',
    coordinates: [116.4174, 39.9093],
    stats: {
      total: { label: '总户数', value: '865' },
      completed: { label: '已安检', value: '259' },
      pending: { label: '超期未检', value: '606', status: 'overdue' }
    },
    progress: {
      percentage: 30,
      completed: 259,
      total: 865,
      lastInspection: '2023-12-20'
    }
  },
  {
    id: '4',
    name: '城南别墅区',
    region: '城南区域',
    type: '别墅区',
    buildingInfo: '128户',
    coordinates: [116.4024, 39.9143],
    stats: {
      total: { label: '总户数', value: '128' },
      completed: { label: '已安检', value: '89' },
      pending: { label: '未安检', value: '39', status: 'pending' }
    },
    progress: {
      percentage: 70,
      completed: 89,
      total: 128,
      lastInspection: '2024-01-18'
    }
  }
])

// 过滤后的区域列表
const filteredAreas = computed(() => {
  if (!searchText.value) return areas.value

  return areas.value.filter(area =>
    area.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
    area.region.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

// 获取进度条颜色
const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return '#52c41a' // 绿色
  if (percentage >= 60) return '#1890ff' // 蓝色
  if (percentage >= 40) return '#faad14' // 橙色
  return '#ff4d4f' // 红色
}

// 获取待处理状态颜色
const getPendingColor = (status: string) => {
  return status === 'overdue' ? '#ff4d4f' : '#faad14'
}

// 搜索处理
const handleSearch = () => {
  console.log('搜索区域:', searchText.value)
}

// 区域点击处理
const handleAreaClick = (area: any) => {
  activeAreaId.value = area.id
  console.log('选择区域:', area.name)

  // 可以在这里触发地图定位
  // emit('area-select', area)
}

// 分配任务处理
const handleAssignTask = (area: any) => {
  ElMessage.info(`开始分配 ${area.name} 的安检任务`)
  console.log('分配任务:', area)
  // 这里可以调用分配任务的API
}

// 查看详情处理
const handleViewDetails = (area: any) => {
  ElMessage.success(`查看 ${area.name} 详情`)
  console.log('查看详情:', area)
  // 这里可以打开详情弹窗或跳转详情页
}
</script>

<style scoped>
.safety-inspection-map {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
}

/* 状态百分比区域 */
.status-summary {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background: linear-gradient(90deg, #f0f7ff 0%, #e6f7ff 100%);
  border-bottom: 1px solid #e8e8e8;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.status-text {
  color: #666;
  font-weight: 500;
}

.status-percentage {
  color: #333;
  font-weight: 600;
  font-size: 16px;
}

/* 搜索区域 */
.search-section {
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.el-input__wrapper) {
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 区域列表 */
.area-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
}

.area-item {
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.area-item:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.1);
  transform: translateY(-2px);
}

.area-item-active {
  border-color: #1890ff;
  background: #f0f7ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
}

/* 区域信息头部 */
.area-header {
  margin-bottom: 12px;
}

.area-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.area-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 统计信息 */
.area-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* 进度条区域 */
.progress-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-circle {
  flex-shrink: 0;
}

.progress-details {
  flex: 1;
}

.progress-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.progress-subtitle {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.progress-time {
  font-size: 12px;
  color: #999;
}

/* 操作按钮 */
.area-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #f0f0f0;
}

/* 滚动条样式 */
.area-list::-webkit-scrollbar {
  width: 6px;
}

.area-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.area-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.area-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
