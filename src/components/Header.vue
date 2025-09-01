<template>
  <header class="bg-primary text-white shadow-md z-50 transition-all duration-300">
    <div class="container mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <i class="fa fa-fire text-2xl"></i>
        <h1 class="text-xl md:text-2xl font-bold">燃气智慧管理平台</h1>
      </div>
      <div class="flex items-center space-x-6">
        <el-button type="text" class="hidden md:block !text-white hover:!text-warning">
          <i class="fa fa-bell-o text-lg"></i>
        </el-button>
        <div class="flex items-center space-x-2">
          <el-avatar :size="32" src="https://picsum.photos/id/1005/40/40" />
          <span class="hidden md:inline">管理员</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Header',
})
</script>
