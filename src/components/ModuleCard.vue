<template>
  <div class="module-card group" :class="cardClasses" @click="$emit('click')">
    <div class="flex justify-between items-start mb-4">
      <h3 class="text-xl font-semibold text-gray-800 group-hover:text-primary transition-colors">
        {{ module.title }}
      </h3>
      <span class="text-sm px-2 py-1 rounded-full flex items-center" :class="statusClasses">
        <i class="fa" :class="statusIcon" class="mr-1"></i>{{ module.statusText }}
      </span>
    </div>
    <p class="text-gray-600 mb-4">{{ module.description }}</p>
    <div class="text-sm" :class="infoClasses">
      <i class="fa fa-info-circle mr-1"></i>
      <span>{{ module.infoText }}</span>
    </div>
    <div class="absolute bottom-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity">
      <i class="fa" :class="moduleIcon" :style="{ fontSize: '100px', color: '#165DFF' }"></i>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue'
import type { ModuleCard as ModuleCardType } from '@/types'

export default defineComponent({
  name: 'ModuleCard',
  props: {
    module: {
      type: Object as PropType<ModuleCardType>,
      required: true,
    },
  },
  emits: ['click'],
  setup(props) {
    const cardClasses = computed(() => ({
      'status-normal': props.module.status === 'normal',
      'status-warning': props.module.status === 'warning',
    }))

    const statusClasses = computed(() => ({
      'bg-success/10 text-success': props.module.status === 'normal',
      'bg-danger/10 text-danger': props.module.status === 'warning',
    }))

    const statusIcon = computed(() => ({
      'fa-check-circle': props.module.status === 'normal',
      'fa-exclamation-circle': props.module.status === 'warning',
    }))

    const infoClasses = computed(() => ({
      'text-success': props.module.status === 'normal',
      'text-danger': props.module.status === 'warning',
    }))

    const moduleIcon = computed(() => `fa-${props.module.icon}`)

    return {
      cardClasses,
      statusClasses,
      statusIcon,
      infoClasses,
      moduleIcon,
    }
  },
})
</script>
