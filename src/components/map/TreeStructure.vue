<template>
  <div class="tree-structure">
    <div class="tree-toolbar">
      <el-input v-model="filterText" placeholder="搜索节点" clearable prefix-icon="Search" class="tree-search" />
      <el-button-group class="tree-actions">
        <el-tooltip content="展开全部">
          <el-button :icon="Expand" @click="expandAll" />
        </el-tooltip>
        <el-tooltip content="折叠全部">
          <el-button :icon="Fold" @click="collapseAll" />
        </el-tooltip>
      </el-button-group>
    </div>
    <el-tree ref="treeRef" :data="data" :props="defaultProps" :filter-node-method="filterNode" node-key="id"
      :default-expanded-keys="defaultExpandedKeys" highlight-current @node-click="handleNodeClick" class="custom-tree">
      <template #default="{ node, data }">
        <span class="tree-node">
          <el-icon v-if="data.icon" :size="16" class="node-icon">
            <component :is="data.icon" />
          </el-icon>
          <span class="node-label">{{ node.label }}</span>
          <el-tag v-if="data.count" size="small" type="info" class="node-count">
            {{ data.count }}
          </el-tag>
        </span>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Expand, Fold } from '@element-plus/icons-vue'

interface TreeData {
  id: string
  label: string
  icon?: string
  count?: number
  children?: TreeData[]
  type?: string
  data?: any
}

interface Props {
  data: TreeData[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  nodeClick: [data: TreeData]
}>()

const filterText = ref('')
const treeRef = ref()

const defaultProps = {
  children: 'children',
  label: 'label',
}

const filterNode = (value: string, data: TreeData) => {
  if (!value) return true
  return data.label.includes(value)
}

const handleNodeClick = (data: TreeData) => {
  emit('nodeClick', data)
}

watch(filterText, (val) => {
  treeRef.value?.filter(val)
})
// ... 原有逻辑保持不变，新增以下方法

const defaultExpandedKeys = ref(['1', '2']) // 默认展开的节点

const expandAll = () => {
  const nodes = (treeRef.value as any)?.store.nodesMap
  if (nodes) {
    defaultExpandedKeys.value = Object.keys(nodes)
    nextTick(() => {
      treeRef.value?.setCurrentKey(null)
    })
  }
}

const collapseAll = () => {
  defaultExpandedKeys.value = []
}
</script>

<style scoped>
.tree-structure {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tree-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.tree-search {
  flex: 1;
}

.tree-actions {
  flex-shrink: 0;
}

.custom-tree {
  flex: 1;
  overflow: auto;
}

.tree-node {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 2px 0;
}

.node-icon {
  margin-right: 6px;
  color: #409eff;
}

.node-label {
  flex: 1;
  font-size: 14px;
}

.node-count {
  margin-left: 8px;
}
</style>
