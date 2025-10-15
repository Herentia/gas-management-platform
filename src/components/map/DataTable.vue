<template>
  <div class="data-table-container">
    <div class="table-toolbar">
      <el-button type="primary" :icon="Refresh" @click="refreshData">刷新</el-button>
      <el-button :icon="Download" @click="exportData">导出</el-button>
      <div class="toolbar-right">
        <el-input v-model="searchText" placeholder="搜索..." clearable prefix-icon="Search" style="width: 200px;"
          @input="handleSearch" />
      </div>
    </div>

    <el-table :data="filteredData" v-loading="loading" stripe highlight-current-row @row-click="handleRowClick"
      style="width: 100%" height="100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" min-width="120" />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getTagType(row.type)" size="small">
            {{ row.type }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === '正常' ? 'success' : 'danger'" size="small">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="位置" min-width="150" />
      <el-table-column prop="updateTime" label="更新时间" width="160" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click.stop="handleView(row)">
            查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="table-pagination">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
        :total="total" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
        @current-change="handleCurrentChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Refresh, Download } from '@element-plus/icons-vue'

interface TableData {
  id: string
  name: string
  type: string
  status: string
  location: string
  updateTime: string
  data?: any
}

interface Props {
  data: TableData[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  rowClick: [data: TableData]
}>()

const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const filteredData = computed(() => {
  let data = props.data
  if (searchText.value) {
    data = data.filter(item =>
      item.name.includes(searchText.value) ||
      item.location.includes(searchText.value) ||
      item.type.includes(searchText.value)
    )
  }
  return data
})

const total = computed(() => filteredData.value.length)

const getTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    '管线': '',
    '设备': 'success',
    '阀门': 'warning',
    '监测点': 'info',
    '警告': 'danger'
  }
  return typeMap[type] || ''
}

const handleRowClick = (row: TableData) => {
  emit('rowClick', row)
}

const handleView = (row: TableData) => {
  console.log('查看详情:', row)
  // 这里可以触发查看详情的逻辑
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

const refreshData = () => {
  // 刷新数据逻辑
  console.log('刷新数据')
}

const exportData = () => {
  // 导出数据逻辑
  console.log('导出数据')
}
</script>

<style scoped>
.data-table-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding: 0 8px;
}
</style>
