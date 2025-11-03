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

    <el-table :data="pagedData" v-loading="loading" stripe highlight-current-row @row-click="handleRowClick"
      style="width: 100%" height="100%" :empty-text="emptyText">
      <!-- 动态列渲染 -->
      <template v-for="column in columns" :key="column.prop">
        <!-- 自定义列 -->
        <el-table-column v-if="column.slot" :prop="column.prop" :label="column.label" :width="column.width"
          :min-width="column.minWidth" :fixed="column.fixed" :sortable="column.sortable">
          <template #default="scope">
            <slot :name="column.slot" :row="scope.row" :$index="scope.$index"></slot>
          </template>
        </el-table-column>

        <!-- 普通列 -->
        <el-table-column v-else :prop="column.prop" :label="column.label" :width="column.width"
          :min-width="column.minWidth" :fixed="column.fixed" :sortable="column.sortable"
          :formatter="column.formatter" />
      </template>

      <!-- 操作列（可选） -->
      <el-table-column v-if="showActions" label="操作" :width="actionsWidth" :fixed="actionsFixed">
        <template #default="{ row }">
          <slot name="actions" :row="row">
            <el-button link type="primary" @click.stop="handleView(row)">
              查看
            </el-button>
            <el-button link type="primary" @click.stop="handleEdit(row)" v-if="showEdit">
              编辑
            </el-button>
            <el-button link type="danger" @click.stop="handleDelete(row)" v-if="showDelete">
              删除
            </el-button>
          </slot>
        </template>
      </el-table-column>
    </el-table>

    <div class="table-pagination" v-if="showPagination">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="pageSizes"
        :total="total" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
        @current-change="handleCurrentChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Refresh, Download } from '@element-plus/icons-vue'

// 列配置接口
interface TableColumn {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  fixed?: boolean | 'left' | 'right'
  sortable?: boolean
  slot?: string // 自定义插槽名称
  formatter?: (row: any, column: any, cellValue: any, index: number) => string
}

// 表格数据接口
interface TableData {
  [key: string]: any
}

// Props
interface Props {
  data: TableData[]
  loading?: boolean
  columns: TableColumn[] // 动态列配置
  showActions?: boolean // 是否显示操作列
  showPagination?: boolean // 是否显示分页
  showEdit?: boolean // 是否显示编辑按钮
  showDelete?: boolean // 是否显示删除按钮
  actionsWidth?: number | string // 操作列宽度
  actionsFixed?: boolean | 'left' | 'right' // 操作列固定
  pageSizes?: number[] // 分页尺寸选项
  emptyText?: string // 空数据提示文本
  searchable?: boolean // 是否启用搜索
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  columns: () => [],
  showActions: true,
  showPagination: true,
  showEdit: false,
  showDelete: false,
  actionsWidth: 120,
  actionsFixed: 'right',
  pageSizes: () => [10, 20, 50, 100],
  emptyText: '暂无数据',
  searchable: true
})

// Emits
const emit = defineEmits<{
  rowClick: [data: TableData]
  view: [data: TableData]
  edit: [data: TableData]
  delete: [data: TableData]
  refresh: []
  export: []
  search: [keyword: string]
}>()

// 响应式数据
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 计算属性
const filteredData = computed(() => {
  let data = props.data

  if (props.searchable && searchText.value) {
    data = data.filter(item => {
      // 搜索所有列的内容
      return Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchText.value.toLowerCase())
      )
    })
  }

  return data
})

const total = computed(() => filteredData.value.length)

const pagedData = computed(() => {
  if (!props.showPagination) {
    return filteredData.value
  }

  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

// 方法
const handleRowClick = (row: TableData) => {
  emit('rowClick', row)
}

const handleView = (row: TableData) => {
  emit('view', row)
}

const handleEdit = (row: TableData) => {
  emit('edit', row)
}

const handleDelete = (row: TableData) => {
  emit('delete', row)
}

const handleSearch = () => {
  currentPage.value = 1
  emit('search', searchText.value)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

const refreshData = () => {
  emit('refresh')
}

const exportData = () => {
  emit('export')
}

// 监听数据变化重置分页
watch(() => props.data, () => {
  currentPage.value = 1
}, { deep: true })

// 监听搜索文本变化
watch(searchText, (newVal) => {
  emit('search', newVal)
})
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
  flex-shrink: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

:deep(.el-table) {
  flex: 1;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding: 0 8px;
  flex-shrink: 0;
}
</style>
