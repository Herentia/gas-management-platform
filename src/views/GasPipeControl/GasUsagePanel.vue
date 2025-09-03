<template>
  <transition name="slide-fade">
    <div v-if="visible" class="gas-usage-panel" :class="[{ minimized: isMinimized }, position]">
      <!-- 正常状态 -->
      <div v-if="!isMinimized" class="panel-content">
        <div class="panel-header">
          <h3>用气统计</h3>
          <div class="header-actions">
            <el-tooltip content="最小化" placement="top">
              <el-button :icon="Minus" circle size="small" @click="minimizePanel" />
            </el-tooltip>
            <el-tooltip content="关闭" placement="top">
              <el-button :icon="Close" circle size="small" @click="closePanel" />
            </el-tooltip>
          </div>
        </div>

        <div class="panel-body">
          <!-- 用气统计内容 -->
          <div class="statistics-content">
            <div class="stat-item">
              <span class="label">今日用气量</span>
              <span class="value">1,245 m³</span>
            </div>
            <div class="stat-item">
              <span class="label">本月用气量</span>
              <span class="value">28,567 m³</span>
            </div>
            <div class="stat-item">
              <span class="label">同比增长</span>
              <span class="value positive">+12.5%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 最小化状态 -->
      <div v-else class="minimized-panel" @click="restorePanel">
        <el-tooltip content="展开用气统计" placement="left">
          <el-icon size="20">
            <DataAnalysis />
          </el-icon>
        </el-tooltip>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Minus, Close, DataAnalysis } from '@element-plus/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  position: {
    type: String,
    default: 'right'
  }
})

const emit = defineEmits(['close', 'minimize'])

const isMinimized = ref(false)

const minimizePanel = () => {
  isMinimized.value = true
  emit('minimize')
}

const restorePanel = () => {
  isMinimized.value = false
}

const closePanel = () => {
  emit('close')
}
</script>

<style scoped>
.gas-usage-panel {
  position: absolute;
  z-index: 999;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  width: 280px;
  transition: all 0.3s ease;
}

.gas-usage-panel.right {
  right: 20px;
  top: 20px;
}

/* 其他样式类似GasSourcePanel */
</style>
