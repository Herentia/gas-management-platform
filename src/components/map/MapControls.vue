<template>
  <div class="map-controls bottom-right">
    <!-- 重置视图 -->
    <div class="control-group">
      <el-tooltip content="重置视图" placement="top">
        <el-button :icon="Aim" circle class="control-btn" @click="emit('reset-view')" />
      </el-tooltip>
    </div>

    <!-- 缩放控制 -->
    <div class="control-group">
      <el-tooltip content="放大" placement="top">
        <el-button :icon="ZoomIn" circle class="control-btn zoom-in" @click="emit('zoom-in')" />
      </el-tooltip>
      <el-tooltip content="缩小" placement="top">
        <el-button :icon="ZoomOut" circle class="control-btn zoom-out" @click="emit('zoom-out')" />
      </el-tooltip>
    </div>

    <!-- 图层管理按钮和面板 -->
    <div class="control-group layers-group">
      <el-tooltip content="图层管理" placement="top">
        <el-button :icon="Management" circle class="control-btn" :class="{ active: showLayersPanel }"
          @click="toggleLayersPanel" />
      </el-tooltip>

      <!-- 图层控制面板 -->
      <transition name="slide-fade">
        <div v-if="showLayersPanel" class="layer-panel" @click.stop>
          <div class="panel-header">
            <span>图层管理</span>
            <el-button :icon="Close" circle size="small" @click="closeLayersPanel" />
          </div>
          <div class="panel-content">
            <el-checkbox-group v-model="selectedLayers">
              <el-checkbox label="pipeline">管网线路</el-checkbox>
              <el-checkbox label="equipment">设备设施</el-checkbox>
              <el-checkbox label="warning">预警点位</el-checkbox>
              <el-checkbox label="station">场站位置</el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import {
  ZoomIn,
  ZoomOut,
  Aim,
  Management,
  Close
} from '@element-plus/icons-vue'

const emit = defineEmits(['zoom-in', 'zoom-out', 'reset-view', 'update:layers'])

// 图层状态
const showLayersPanel = ref(false)
const selectedLayers = ref(['pipeline', 'equipment', 'warning'])

// 监听图层变化
watch(selectedLayers, (newLayers) => {
  emit('update:layers', newLayers)
})

const toggleLayersPanel = () => {
  showLayersPanel.value = !showLayersPanel.value
}

const closeLayersPanel = () => {
  showLayersPanel.value = false
}

// 点击外部关闭面板
const handleClickOutside = (event: MouseEvent) => {
  const controls = document.querySelector('.map-controls')
  const panel = document.querySelector('.layer-panel')

  if (panel && controls &&
    !panel.contains(event.target as Node) &&
    !controls.contains(event.target as Node)) {
    closeLayersPanel()
  }
}

// 添加全局点击监听
if (typeof window !== 'undefined') {
  window.addEventListener('click', handleClickOutside)
}

// 组件卸载时移除监听器
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', handleClickOutside)
  }
})
</script>

<style scoped>
.map-controls.bottom-right {
  position: absolute;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column-reverse;
  /* 反向排列，让重置视图在最下面 */
  gap: 12px;
  align-items: flex-end;
}

.control-group {
  position: relative;
  background: white;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.layers-group {
  padding: 8px;
}

.control-btn {
  width: 40px;
  height: 40px;
  font-size: 16px;
  border: none;
  background: white;
  transition: all 0.2s ease;
  position: relative;
  z-index: 2;
}

.control-btn:hover {
  background: #f8fafc;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-btn:active {
  transform: translateY(0);
  box-shadow: none;
}

.control-btn.active {
  background: #165DFF;
  color: white;
}

.zoom-in {
  border-radius: 20px 20px 8px 8px;
}

.zoom-out {
  border-radius: 8px 8px 20px 20px;
}

/* 图层控制面板 */
.layer-panel {
  position: absolute;
  right: 0;
  bottom: calc(100% + 8px);
  width: 220px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
  padding: 16px;
  border: 1px solid #e5e7eb;
  z-index: 1001;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.panel-header span {
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 过渡动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .map-controls.bottom-right {
    right: 10px;
    bottom: 10px;
    gap: 10px;
  }

  .control-group {
    padding: 6px;
    gap: 6px;
  }

  .control-btn {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }

  .layer-panel {
    width: 200px;
    padding: 12px;
    bottom: calc(100% + 6px);
  }
}

@media (max-width: 480px) {
  .map-controls.bottom-right {
    right: 8px;
    bottom: 8px;
    gap: 8px;
  }

  .control-group {
    padding: 4px;
    gap: 4px;
  }

  .control-btn {
    width: 32px;
    height: 32px;
    font-size: 13px;
  }

  .layer-panel {
    width: 180px;
    padding: 10px;
    bottom: calc(100% + 4px);
  }

  .panel-header span {
    font-size: 13px;
  }
}

/* 确保按钮点击区域正确 */
:deep(.el-button) {
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-tooltip__trigger) {
  outline: none;
}

:deep(.el-button.is-circle) {
  border-radius: 50%;
}

/* 复选框样式 */
:deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.el-checkbox) {
  margin-right: 0;
}

:deep(.el-checkbox__label) {
  font-size: 13px;
  color: #374151;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .map-controls.bottom-right {
    flex-direction: row;
    /* 移动端横向排列 */
    flex-direction: row-reverse;
    align-items: flex-end;
    gap: 8px;
  }

  .control-group {
    flex-direction: row;
    gap: 6px;
  }

  .layer-panel {
    right: auto;
    left: 0;
    bottom: calc(100% + 6px);
  }
}

@media (max-width: 480px) {
  .map-controls.bottom-right {
    gap: 6px;
  }

  .control-group {
    gap: 4px;
  }

  .layer-panel {
    width: 160px;
    left: -60px;
  }
}
</style>
