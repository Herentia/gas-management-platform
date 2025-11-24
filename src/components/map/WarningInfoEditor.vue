<!-- components/map/WarningInfoEditor.vue -->
<template>
  <div class="warning-info-editor">
    <!-- 标题 -->
    <div class="section-header">
      <h3>预警信息编辑</h3>
    </div>

    <!-- 信息标题 -->
    <div class="title-section">
      <div class="section-title">信息标题</div>
      <el-input
        v-model="warningTitle"
        placeholder="紧急通知：XX区域管道泄漏抢修"
        @input="handleTitleChange"
        class="title-input"
      />
    </div>

    <!-- 紧急程度 -->
    <div class="level-section">
      <div class="section-title">紧急程度</div>
      <el-select
        v-model="warningLevel"
        placeholder="请选择紧急程度"
        @change="handleLevelChange"
        class="level-select"
      >
        <el-option label="最高级 - 严重泄漏" value="highest" />
        <el-option label="高级 - 重大泄漏" value="high" />
        <el-option label="中级 - 一般泄漏" value="medium" />
        <el-option label="低级 - 轻微泄漏" value="low" />
      </el-select>
    </div>

    <!-- 信息内容 -->
    <div class="content-section">
      <div class="section-title">信息内容</div>
      <el-input
        v-model="warningContent"
        type="textarea"
        :rows="4"
        placeholder="紧急通知：位于XX路与XX街交叉口发生管道泄漏，我公司已紧急派出抢险队伍前往处理。"
        @input="handleContentChange"
        class="content-input"
      />
    </div>

    <!-- 分隔线 -->
    <div class="divider"></div>

    <!-- 推送渠道 -->
    <div class="channel-section">
      <div class="section-title">推送渠道</div>
      <div class="channel-checkboxes">
        <el-checkbox-group v-model="selectedChannels" @change="handleChannelChange">
          <div class="channel-item">
            <el-checkbox value="internal">内部管理人员（短信）</el-checkbox>
          </div>
          <div class="channel-item">
            <el-checkbox value="wechat">微信公众号</el-checkbox>
          </div>
          <div class="channel-item">
            <el-checkbox value="command">应急指挥群（微信）</el-checkbox>
          </div>
          <div class="channel-item">
            <el-checkbox value="rescue">抢险队伍（APP推送）</el-checkbox>
          </div>
        </el-checkbox-group>
      </div>
    </div>

    <!-- 分隔线 -->
    <div class="divider"></div>

    <!-- 操作按钮 -->
    <div class="action-section">
      <el-button
        type="info"
        @click="handleSaveDraft"
        class="action-btn">
        保存为草稿
      </el-button>
      <div class="action-buttons">
        <el-button
          type="primary"
          @click="handleSendDirect"
          :disabled="!isFormValid"
          class="send-btn">
          直接发送
        </el-button>
        <el-button
          type="warning"
          @click="handleForwardApproval"
          :disabled="!isFormValid"
          class="forward-btn">
          转发审批
        </el-button>
      </div>
    </div>

    <!-- 分隔线 -->
    <div class="divider"></div>

    <!-- 相关人员 -->
    <div class="personnel-section">
      <div class="section-title">相关人员</div>
      <div class="personnel-list">
        <div class="personnel-group">
          <div class="group-title">内部管理人员</div>
          <div
            v-for="person in internalManagers"
            :key="person.id"
            class="person-item">
            <div class="person-name">{{ person.name }}</div>
            <div class="person-position">{{ person.position }}</div>
            <div v-if="person.status" class="person-status" :class="getStatusClass(person.status)">
              {{ person.status }}
            </div>
          </div>
        </div>
        <div class="personnel-group">
          <div class="group-title">抢险队伍</div>
          <div
            v-for="person in rescueTeam"
            :key="person.id"
            class="person-item">
            <div class="person-name">{{ person.name }}</div>
            <div class="person-position">{{ person.position }}</div>
            <div v-if="person.status" class="person-status" :class="getStatusClass(person.status)">
              {{ person.status }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, watch } from 'vue'

interface WarningData {
  title: string
  level: string
  content: string
  channels: string[]
}

interface RelatedPerson {
  id: string
  name: string
  position: string
  status?: string
  type: 'manager' | 'rescue'
}

const props = defineProps<{
  warningData?: WarningData | null
  relatedPersons?: RelatedPerson[]
}>()

const emit = defineEmits([
  'title-change',
  'level-change',
  'content-change',
  'channel-change',
  'save-draft',
  'send-direct',
  'forward-approval'
])

// 响应式数据
const warningTitle = ref('紧急通知：XX区域管道泄漏抢修')
const warningLevel = ref('highest')
const warningContent = ref('紧急通知：位于XX路与XX街交叉口发生管道泄漏，我公司已紧急派出抢险队伍前往处理。')
const selectedChannels = ref<string[]>(['internal', 'command', 'rescue'])

// 计算属性
const isFormValid = computed(() => {
  return warningTitle.value.trim() !== '' &&
         warningLevel.value !== '' &&
         warningContent.value.trim() !== '' &&
         selectedChannels.value.length > 0
})

const internalManagers = computed(() => {
  return props.relatedPersons?.filter(person => person.type === 'manager') || []
})

const rescueTeam = computed(() => {
  return props.relatedPersons?.filter(person => person.type === 'rescue') || []
})

// 监听外部数据变化
watch(() => props.warningData, (newData) => {
  if (newData) {
    warningTitle.value = newData.title
    warningLevel.value = newData.level
    warningContent.value = newData.content
    selectedChannels.value = newData.channels
  }
})

// 处理方法
const handleTitleChange = () => {
  emit('title-change', warningTitle.value)
}

const handleLevelChange = (level: string) => {
  emit('level-change', level)
}

const handleContentChange = () => {
  emit('content-change', warningContent.value)
}

const handleChannelChange = (channels: string[]) => {
  emit('channel-change', channels)
}

const handleSaveDraft = () => {
  const warningData: WarningData = {
    title: warningTitle.value,
    level: warningLevel.value,
    content: warningContent.value,
    channels: selectedChannels.value
  }
  emit('save-draft', warningData)
}

const handleSendDirect = () => {
  const warningData: WarningData = {
    title: warningTitle.value,
    level: warningLevel.value,
    content: warningContent.value,
    channels: selectedChannels.value
  }
  emit('send-direct', warningData)
}

const handleForwardApproval = () => {
  const warningData: WarningData = {
    title: warningTitle.value,
    level: warningLevel.value,
    content: warningContent.value,
    channels: selectedChannels.value
  }
  emit('forward-approval', warningData)
}

const getStatusClass = (status: string) => {
  return status === '待命' ? 'status-ready' : 'status-busy'
}
</script>

<style scoped>
.warning-info-editor {
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.section-header {
  text-align: center;
  margin-bottom: 8px;
}

.section-header h3 {
  margin: 0;
  color: #1E6FBA;
  font-size: 16px;
  font-weight: 600;
}

.section-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #1E6FBA;
  font-size: 14px;
}

.title-input,
.level-select,
.content-input {
  width: 100%;
}

.divider {
  height: 1px;
  background: #e5e7eb;
  margin: 8px 0;
}

.channel-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.channel-item {
  padding: 4px 0;
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn,
.send-btn,
.forward-btn {
  flex: 1;
}

.personnel-list {
  max-height: 300px;
  overflow-y: auto;
}

.personnel-group {
  margin-bottom: 16px;
}

.group-title {
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
  font-size: 13px;
  padding-left: 8px;
  border-left: 3px solid #1E6FBA;
}

.person-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  margin-bottom: 6px;
  gap: 12px;
}

.person-name {
  font-weight: 500;
  color: #334155;
  min-width: 60px;
  font-size: 13px;
}

.person-position {
  flex: 1;
  color: #64748b;
  font-size: 12px;
}

.person-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.status-ready {
  background: #dcfce7;
  color: #166534;
}

.status-busy {
  background: #fef3c7;
  color: #92400e;
}
</style>
