<template>
  <div class="alert-list">
    <div class="space-y-4 max-h-200 overflow-y-auto pr-2">
      <div v-for="(alert, index) in alerts" :key="index" :class="['alert-item', `alert-${alert.type}`]">
        <i :class="alertIconClass(alert.type)" class="alert-icon"></i>
        <div class="alert-content">
          <p class="alert-title">{{ alert.title }}</p>
          <p class="alert-detail">{{ alert.location }} - {{ alert.time }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AlertItem } from '@/types'

defineProps<{
  alerts: AlertItem[]
}>()

const alertIconClass = (type: string) => {
  return type === 'danger' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'
}
</script>

<style scoped>
.alert-list {
  width: 100%;
}

.space-y-4>*+* {
  margin-top: 1rem;
}

.max-h-200 {
  max-height: 200px;
}

.overflow-y-auto {
  overflow-y: auto;
}

.pr-2 {
  padding-right: 0.5rem;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border-left-width: 4px;
}

.alert-danger {
  background-color: rgba(245, 63, 63, 0.1);
  border-left-color: #F53F3F;
}

.alert-warning {
  background-color: rgba(255, 125, 0, 0.1);
  border-left-color: #FF7D00;
}

.alert-icon {
  margin-top: 0.25rem;
  margin-right: 0.75rem;
  font-size: 1rem;
}

.alert-danger .alert-icon {
  color: #F53F3F;
}

.alert-warning .alert-icon {
  color: #FF7D00;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 500;
  color: #1F2937;
  margin-bottom: 0.25rem;
}

.alert-detail {
  font-size: 0.875rem;
  color: #6B7280;
}
</style>
