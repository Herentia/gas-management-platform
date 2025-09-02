<template>
  <div :class="['module-card', 'group', statusClass]" @click="$emit('click')">
    <div class="card-header">
      <h3 class="card-title">{{ cardData.title }}</h3>
      <span :class="statusBadgeClass">
        <i :class="statusIconClass" class="status-icon"></i>
        {{ cardData.statusText }}
      </span>
    </div>

    <p class="card-description">{{ cardData.description }}</p>

    <div :class="infoTextClass">
      <i class="fa fa-info-circle info-icon"></i>
      <span>{{ cardData.infoText }}</span>
    </div>

    <div class="card-icon">
      <i :class="cardData.icon" class="icon"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ModuleCard as ModuleCardType } from '@/types'

// 使用 cardData 代替 module
const props = defineProps<{
  cardData: ModuleCardType
}>()

defineEmits<{
  (e: 'click'): void
}>()

// 计算状态类
const statusClass = computed(() => {
  return props.cardData.status === 'normal' ? 'status-normal' : 'status-warning'
})

// 计算状态徽章类
const statusBadgeClass = computed(() => {
  const baseClass = 'status-badge'
  return props.cardData.status === 'normal'
    ? `${baseClass} status-badge-normal`
    : `${baseClass} status-badge-warning`
})

// 计算状态图标类
const statusIconClass = computed(() => {
  return props.cardData.status === 'normal' ? 'fa-check-circle' : 'fa-exclamation-circle'
})

// 计算信息文本类
const infoTextClass = computed(() => {
  const baseClass = 'info-text'
  return props.cardData.status === 'normal'
    ? `${baseClass} info-text-normal`
    : `${baseClass} info-text-warning`
})
</script>

<style scoped>
.module-card {
  position: relative;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  cursor: pointer;
  overflow: hidden;
}

.module-card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.module-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 0.25rem;
  transition: all 0.3s;
}

/* 状态正常样式 */
.status-normal {
  background-color: white;
  border-left: 4px solid #00B42A;
}

.status-normal::before {
  background-color: #00B42A;
}

/* 状态警告样式 */
.status-warning {
  background-color: white;
  border-left: 4px solid #F53F3F;
}

.status-warning::before {
  background-color: #F53F3F;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1F2937;
  transition: color 0.3s;
}

.group:hover .card-title {
  color: #165DFF;
}

.status-badge {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
}

.status-badge-normal {
  background-color: rgba(0, 180, 42, 0.1);
  color: #00B42A;
}

.status-badge-warning {
  background-color: rgba(245, 63, 63, 0.1);
  color: #F53F3F;
}

.status-icon {
  margin-right: 0.25rem;
  font-size: 0.75rem;
}

.card-description {
  color: #4B5563;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.info-text {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
}

.info-text-normal {
  color: #00B42A;
}

.info-text-warning {
  color: #F53F3F;
}

.info-icon {
  margin-right: 0.25rem;
}

.card-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  opacity: 0.1;
  transition: opacity 0.3s;
}

.group:hover .card-icon {
  opacity: 0.2;
}

.icon {
  font-size: 6rem;
  color: #165DFF;
}
</style>
