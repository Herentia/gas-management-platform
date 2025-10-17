<template>
  <div class="official-info-popup">
    <!-- 头部 -->
    <div class="popup-header">
      <h3 class="popup-title">管网信息</h3>
      <el-button link :icon="Close" @click="handleClose" class="close-btn" />
    </div>

    <!-- 内容 -->
    <div class="popup-content">
      <div class="info-table">
        <div class="info-row">
          <div class="info-label">管网名称：</div>
          <div class="info-value">{{ infoData.name || '-' }}</div>
        </div>
        <div class="info-row">
          <div class="info-label">管网材质：</div>
          <div class="info-value">{{ infoData.material || '-' }}</div>
        </div>
        <div class="info-row">
          <div class="info-label">使用年限：</div>
          <div class="info-value">{{ infoData.years || '-' }}</div>
        </div>
        <div class="info-row">
          <div class="info-label">压力等级：</div>
          <div class="info-value">{{ infoData.pressureLevel || '-' }}</div>
        </div>
        <div class="info-row">
          <div class="info-label">防腐材料：</div>
          <div class="info-value">{{ infoData.anticorrosion || '-' }}</div>
        </div>
        <div class="info-row">
          <div class="info-label">管径：</div>
          <div class="info-value">{{ infoData.diameter || '-' }}</div>
        </div>
        <div class="info-row">
          <div class="info-label">其他：</div>
          <div class="info-value">{{ infoData.other || '-' }}</div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="popup-actions">
      <el-button type="primary" @click="handleViewDetail" class="view-detail-btn">查看详情</el-button>
      <el-button @click="handleClose">关闭</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Close } from '@element-plus/icons-vue'

interface OfficialInfo {
  name?: string
  material?: string
  years?: string
  pressureLevel?: string
  anticorrosion?: string
  diameter?: string
  other?: string
}

interface Props {
  infoData: OfficialInfo
  themeColors?: any
  onClose?: () => void
  onViewDetail?: (data: OfficialInfo) => void
}

const props = withDefaults(defineProps<Props>(), {
  infoData: () => ({}),
  themeColors: () => ({
    primary: '#1E6FBA',
    borderBlue: '#B8D9F5'
  })
})

const emit = defineEmits<{
  close: []
  viewDetail: [data: OfficialInfo]
}>()

const handleClose = () => {
  emit('close')
}

const handleViewDetail = () => {
  emit('viewDetail', props.infoData)
}
</script>

<style scoped>
.official-info-popup {
  /* width: 400px; */
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid v-bind('props.themeColors.borderBlue');
  overflow: hidden;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 20px;
  background: linear-gradient(90deg, v-bind('props.themeColors.primary') 0%, #165B9C 100%);
  color: white;
}

.popup-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  color: rgba(255, 255, 255, 0.8);
  padding: 4px;
}

.close-btn:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.popup-content {
  padding: 20px;
}

.info-table {
  width: 100%;
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 4px;
  padding-bottom: 3px;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.info-label {
  width: 100px;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  font-size: 13px;
  color: #333;
  font-weight: 500;
  word-break: break-all;
}

.popup-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: #f8fafc;
}

.view-detail-btn {
  flex: 1;
  background: v-bind('props.themeColors.primary');
  border-color: v-bind('props.themeColors.primary');
}

.view-detail-btn:hover {
  background: #165B9C;
  border-color: #165B9C;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .official-info-popup {
    width: 320px;
  }

  .popup-header {
    padding: 12px 16px;
  }

  .popup-content {
    padding: 16px;
  }

  .info-label {
    width: 80px;
  }

  .popup-actions {
    padding: 12px 16px;
  }
}
</style>
