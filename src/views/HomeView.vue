<template>
  <div class="fade-in">
    <h2 class="text-[clamp(1.5rem,3vw,2rem)] font-bold mb-6 text-gray-800">功能模块</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <ModuleCard
        v-for="(module, index) in modules"
        :key="index"
        :module="module"
        @click="$router.push(module.route)"
      />
    </div>

    <!-- 系统概览 -->
    <div class="mt-10">
      <h2 class="text-[clamp(1.5rem,3vw,2rem)] font-bold mb-6 text-gray-800">系统概览</h2>
      <StatusCharts />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import StatusCharts from '@/components/charts/StatusCharts.vue'
import ModuleCard from '@/components/ModuleCard.vue'
import type { ModuleCard as ModuleCardType } from '@/types'

export default defineComponent({
  name: 'HomeView',
  components: {
    StatusCharts,
    ModuleCard,
  },
  setup() {
    const modules = ref<ModuleCardType[]>([
      {
        title: '管网管理',
        status: 'warning',
        description: '实时监测管网运行状态，包括流量、压力等关键指标',
        statusText: '异常',
        infoText: '调压箱压力异常（3处）',
        icon: 'sitemap',
        route: '/pipe-network',
      },
      {
        title: '巡检管理',
        status: 'normal',
        description: '管理市政管网、庭院管网巡检及入户安检任务',
        statusText: '正常',
        infoText: '今日巡检任务已完成80%',
        icon: 'walking',
        route: '/inspection',
      },
      {
        title: '工程管理',
        status: 'warning',
        description: '负责应急抢险和工程建设的全流程管理',
        statusText: '异常',
        infoText: '2项工程建设已逾期',
        icon: 'building',
        route: '/engineering',
      },
      {
        title: '客服管理',
        status: 'normal',
        description: '处理用户咨询、查询用户信息及管理服务请求',
        statusText: '正常',
        infoText: '当前无未处理客服请求',
        icon: 'users',
        route: '/customer-service',
      },
    ])

    return {
      modules,
    }
  },
})
</script>
