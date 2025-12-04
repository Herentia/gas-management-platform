<template>
  <Header :menu-type="currentMenuType" @menu-click="handleMenuClick" />
  <div class="pipe-network-view">
    <!-- 地图容器 -->
    <div class="map-content">
      <div class="map-container">
        <div id="ol-map" ref="mapContainer" class="ol-map"></div>

        <!-- 移除了固定的弹窗元素，弹窗将通过JS动态创建 -->

        <!-- 其他组件保持不变 -->
        <MapInfoDisplay :scale="scale" :longitude="longitude" :latitude="latitude" :altitude="altitude"
          :viewAngle="viewAngle" :viewHeight="viewHeight" class="info-display-adjusted" />

        <MapControls @zoom-in="zoomIn" @zoom-out="zoomOut" @reset-view="resetView" :layers="selectedLayers"
          @update:layers="selectedLayers = $event" />

        <DynamicPanelContainer />

        <!-- 管网类型面板 -->
        <PipeTypePanel v-if="showPipeTypePanel" :position="pipeTypePanelPosition" :size="pipeTypePanelSize"
          :theme-colors="gasBlueTheme" @close="showPipeTypePanel = false" @filter-change="handlePipeTypeFilterChange"
          @minimize="handlePipeTypeMinimize" />

        <!-- 左侧面板区域，使其支持多个组件 -->
        <div class="floating-panel left-gas-status-panel"
          :class="{ 'panel-hidden': !showGasPanel, 'with-bottom-panel': showBottomPanel }" :style="gasStatusPanelStyle">
          <div class="panel-header">
            <div class="panel-title">
              <el-icon>
                <DataLine v-if="currentGasPanel === 'status'" />
                <Operation v-else-if="currentGasPanel === 'analysis'" />
                <Tools v-else-if="currentGasPanel === 'emergency-command'" />
                <Cpu v-else-if="currentGasPanel === 'terminal-equipment'" />
              </el-icon>
              <span>{{ gasPanelTitle }}</span>
            </div>
            <div class="panel-actions">
              <!-- 根据当前面板显示不同的操作按钮 -->
              <template v-if="currentGasPanel === 'terminal-equipment'">
                <el-tooltip content="刷新设备数据">
                  <el-button link :icon="Refresh" @click="refreshTerminalData" />
                </el-tooltip>
              </template>
              <template v-else-if="currentGasPanel === 'status'">
                <el-tooltip content="刷新气源数据">
                  <el-button link :icon="Refresh" @click="refreshGasStatusData" />
                </el-tooltip>
              </template>
              <el-button link :icon="Close" @click="showGasPanel = false" class="close-btn" />
            </div>
          </div>
          <div class="panel-content">
            <!-- 气源压力运行状态组件 -->
            <GasStatusPanel v-if="currentGasPanel === 'status'" :data="gasStatusDevices"
              @device-click="handleGasDeviceClick" @search="handleGasSearch" @status-change="handleGasStatusChange"
              @export="exportGasStatusData" />

            <!-- 关阀分析组件 -->
            <GasAnalysisPanel v-else-if="currentGasPanel === 'analysis'" :valve-data="currentValve"
              @valve-search="handleValveSearch" @valve-locate="handleValveLocate"
              @impact-analysis="handleImpactAnalysis" @generate-notice="generateShutdownNotice"
              :analysis-result="analysisResult" :operation-records="operationRecords" />

            <!-- 应急抢险组件 -->
            <EmergencyRescuePanel v-else-if="currentGasPanel === 'emergency-command'" :leak-data="currentLeakData"
              @location-method-change="handleLocationMethodChange" @coordinate-input="handleCoordinateInput"
              @gps-get="handleGPSGet" @leak-describe="handleLeakDescribe" @locate-leak="handleLocateLeak"
              @analyze-impact="handleAnalyzeImpact" :rescue-records="rescueRecords" />

            <!-- 终端设备管理组件 -->
            <TerminalEquipmentPanel v-else-if="currentGasPanel === 'terminal-equipment'" ref="terminalEquipmentRef"
              @device-click="handleTerminalDeviceClick" />
          </div>
          <div class="panel-resize-handle" @mousedown="startResize('gasStatus')"></div>
        </div>

        <!-- 修改现有的右侧面板区域 -->
        <div class="floating-panel right-panel"
          :class="{ 'panel-hidden': !showRightPanel, 'with-bottom-panel': showBottomPanel }" :style="rightPanelStyle">
          <div class="panel-header">
            <div class="panel-title">
              <el-icon>
                <Edit v-if="currentRightPanel === 'warning'" />
                <Monitor v-else-if="currentRightPanel === 'valve-detail'" />
              </el-icon>
              <span>{{ rightPanelTitle }}</span>
            </div>
            <div class="panel-actions">
              <el-button link :icon="Close" @click="showRightPanel = false" class="close-btn" />
            </div>
          </div>
          <div class="panel-content">
            <!-- 预警信息编辑组件 -->
            <WarningInfoEditor v-if="currentRightPanel === 'warning'" :warning-data="currentWarningData"
              @title-change="handleWarningTitleChange" @level-change="handleWarningLevelChange"
              @content-change="handleWarningContentChange" @channel-change="handleWarningChannelChange"
              @save-draft="saveWarningDraft" @send-direct="sendWarningDirect" @forward-approval="forwardWarningApproval"
              :related-persons="relatedPersons" />

            <!-- 阀门设备详情组件 -->
            <ValveDetailPanel v-else-if="currentRightPanel === 'valve-detail'" :valve-data="currentValveDetail"
              @navigate="handleValveNavigation" />
          </div>
          <div class="panel-resize-handle left" @mousedown="startResize('right')"></div>
        </div>

        <!-- 左侧树形结构悬浮面板 -->
        <div class="floating-panel left-tree-panel"
          :class="{ 'panel-hidden': !showLeftPanel, 'with-bottom-panel': showBottomPanel }" :style="leftTreePanelStyle">
          <div class="panel-header">
            <div class="panel-title">
              <el-icon>
                <Folder />
              </el-icon>
              <span>管网结构</span>
            </div>
            <div class="panel-actions">
              <el-button link :icon="Close" @click="showLeftPanel = false" class="close-btn" />
            </div>
          </div>
          <div class="panel-content">
            <TreeStructure :data="treeData" @node-click="handleTreeNodeClick" v-if="showLeftPanel" />
            <!-- 图例组件 - 只在full-analysis时显示 -->
            <!-- <LegendComponent v-if="activeMenu === '/pipe-network/equipment'" /> -->
          </div>
          <div class="panel-resize-handle" @mousedown="startResize('left')"></div>
        </div>

        <!-- 修改底部面板，添加终端统计组件 -->
        <div class="floating-panel bottom-table-panel" :class="{ 'panel-hidden': !showBottomPanel }">
          <div class="panel-header">
            <div class="panel-title">
              <el-icon>
                <Grid />
              </el-icon>
              <span>{{ bottomTableTitle }}</span>
            </div>
            <div class="panel-actions">
              <!-- 根据当前面板显示不同的操作按钮 -->
              <template v-if="currentBottomPanel === 'terminal-stats'">
                <el-tooltip content="刷新统计">
                  <el-button link :icon="Refresh" @click="refreshTerminalStats" />
                </el-tooltip>
              </template>
              <template v-else>
                <el-tooltip content="刷新数据">
                  <el-button link :icon="Refresh" @click="refreshTableData" />
                </el-tooltip>
                <el-tooltip content="导出数据">
                  <el-button link :icon="Download" @click="exportTableData" />
                </el-tooltip>
              </template>
              <el-button link :icon="Close" @click="showBottomPanel = false" class="close-btn" />
            </div>
          </div>
          <div class="panel-content">
            <!-- 终端统计面板 -->
            <TerminalStatsPanel ref="terminalStatsRef" v-if="currentBottomPanel === 'terminal-stats'" />

            <!-- 原有的数据表格 -->
            <DataTable v-else :data="tableData" :loading="tableLoading" :columns="tableColumns" :show-actions="true"
              :show-pagination="true" :show-edit="false" :show-delete="false" @row-click="handleTableRowClick"
              @view="handleTableView" @refresh="refreshTableData" @export="exportTableData" @search="handleTableSearch">
              <!-- 自定义插槽保持不变 -->
              <template #status="{ row }">
                <el-tag :type="row.status === '正常' ? 'success' : 'danger'" size="small">
                  {{ row.status }}
                </el-tag>
              </template>

              <template #type="{ row }">
                <el-tag :type="getTagType(row.type)" size="small">
                  {{ row.type }}
                </el-tag>
              </template>

              <template #actions="{ row }">
                <el-button link type="primary" @click.stop="handleTableView(row)">
                  查看
                </el-button>
                <el-button link type="warning" @click.stop="handleTableEdit(row)">
                  编辑
                </el-button>
              </template>
            </DataTable>
          </div>
          <div class="panel-resize-handle vertical" @mousedown="startResize('bottom')"></div>
        </div>

        <!-- 图例面板 -->
        <LegendPanel :visible="showLegendPanel" :legend-items="legendItems" :title="legendTitle"
          @selection-change="handleLegendSelectionChange" @close="showLegendPanel = false" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from '@/components/layout/HeaderWithMenu.vue'
import MapInfoDisplay from '@/components/map/MapInfoDisplay.vue'
import MapControls from '@/components/map/MapControls.vue'
import DynamicPanelContainer from './GasPipeControl/DynamicPanelContainer.vue'
import { useRoute, useRouter } from 'vue-router'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import { fromLonLat, toLonLat } from 'ol/proj'
import { defaults as defaultControls, ScaleLine } from 'ol/control'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Feature } from 'ol'
import { Point, LineString } from 'ol/geom'
import { Style, Stroke, Circle, Fill, Text as OlText } from 'ol/style'

// 原有导入保持不变
import TreeStructure from '@/components/map/TreeStructure.vue'
import DataTable from '@/components/map/DataTable.vue'
import { Folder, Grid, Refresh, Download, Close, Box, SetUp, Switch, Monitor, OfficeBuilding } from '@element-plus/icons-vue'
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

// 原有导入保持不变
import DeviceDetailPanel from '@/components/device/DeviceDetailPanel.vue'
// OpenLayers 弹窗相关导入
import Overlay from 'ol/Overlay'

// 新增导入
import { DataLine } from '@element-plus/icons-vue'
import GasStatusPanel from '@/components/map/GasStatusPanel.vue'

// 新增导入
import PipeTypePanel from '@/components/map/PipeTypePanel.vue'

import OfficialInfoPopup from '@/components/map/OfficialInfoPopup.vue'
import type { Nullable } from 'element-plus/lib/components/cascader-panel/src/node.js'

// 导入图例组件
import LegendPanel from '@/components/map/LegendComponent.vue'
import { ta } from 'element-plus/es/locales.mjs'

// 导入动态弹窗组件
import DynamicPopup from '@/components/map/DynamicPopup.vue'
import { add } from 'ol/coordinate'

import { apiModules } from '@/api'; // 导入模块化的 api

// 导入关阀分析组件
import GasAnalysisPanel from '@/components/map/GasAnalysisPanel.vue'
import { ElMessage } from 'element-plus'
// 导入应急抢险组件
import EmergencyRescuePanel from '@/components/map/EmergencyRescuePanel.vue'
// 导入预警信息编辑组件
import WarningInfoEditor from '@/components/map/WarningInfoEditor.vue'
// 导入阀门设备详情组件
import ValveDetailPanel from '@/components/device/ValveDetailPanel.vue'
// 导入终端设备管理组件
import TerminalEquipmentPanel from '@/components/map/TerminalEquipmentPanel.vue'
import TerminalStatsPanel from '@/components/map/TerminalStatsPanel.vue'


// 在响应式数据部分添加
const showRightPanel = ref(false)
const rightPanelWidth = ref(350)
const currentRightPanel = ref<'warning' | 'valve-detail'>('warning')
const currentValveDetail = ref<any>(null)

const refreshTerminalStats = () => {
  if (terminalStatsRef.value) {
    terminalStatsRef.value.refreshStats()
  }
}

// 右侧面板样式
const rightPanelStyle = computed(() => {
  const style: any = {
    width: `${rightPanelWidth.value}px`
  }

  if (showBottomPanel.value && showRightPanel.value) {
    const bottomPanelVisibleHeight = bottomPanelHeight.value + 40
    style.height = `calc(100% - ${bottomPanelVisibleHeight}px)`
  } else {
    style.height = 'calc(100% - 40px)'
  }

  return style
})

// 右侧面板标题
const rightPanelTitle = computed(() => {
  const titles = {
    'warning': '预警信息编辑',
    'valve-detail': '阀门设备详情'
  }
  return titles[currentRightPanel.value] || '右侧面板'
})

// 在关阀分析方法中修改 handleImpactAnalysis
const handleImpactAnalysis = async (valve: any) => {
  console.log('执行影响分析:', valve)

  // 模拟分析过程
  await new Promise(resolve => setTimeout(resolve, 2000))

  // 模拟分析结果
  analysisResult.value = {
    affectedUsers: 14,
    affectedArea: 0.87,
    affectedPipelineLength: 3.2
  }

  // 在右侧面板显示阀门设备详情
  showValveDetailInRightPanel(valve)

  // 添加操作记录
  operationRecords.value.unshift({
    action: '执行影响分析',
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    details: `影响用户: ${analysisResult.value.affectedUsers} 户`
  })
}

// 新增方法：在右侧面板显示阀门详情
const showValveDetailInRightPanel = (valve: any) => {
  // 转换阀门数据格式
  currentValveDetail.value = {
    id: valve.id,
    name: valve.name,
    specification: 'DN150 球阀',
    installationDate: '2018-05-12',
    lastMaintenance: '2023-11-03',
    coordinates: `${valve.coordinates[1].toFixed(4)}°, ${valve.coordinates[0].toFixed(4)}°`,
    connectedPipelines: 'P-5678, P-5679',
    status: 'normal'
  }

  // 切换到阀门详情面板并显示
  currentRightPanel.value = 'valve-detail'
  showRightPanel.value = true
}

// 处理导航事件
const handleValveNavigation = (valveData: any) => {
  console.log('导航到阀门位置:', valveData)
  // 这里可以集成实际的地图导航功能
  ElMessage.success(`开始导航到 ${valveData.name}`)

  // 聚焦到阀门位置
  if (map) {
    const coords = valveData.coordinates.split(',').map((coord: string) =>
      parseFloat(coord.replace('°', '').trim())
    )
    focusOnCoordinates([coords[1], coords[0]]) // 注意坐标顺序
  }
}

// 关阀分析相关数据
const currentValve = ref<any>(null)
const analysisResult = ref<any>(null)
const operationRecords = ref<any[]>([
  {
    action: '定位阀门 V-12345',
    time: '10:23',
    details: '坐标: 36.60192102, 109.46853429'
  },
  {
    action: '执行影响分析',
    time: '昨天 16:45',
    details: '影响用户: 876 户'
  },
  {
    action: '发送停气通知',
    time: '昨天 15:30',
    details: '通知用户: 520 户'
  }
])

// 关阀分析相关方法
const handleValveSearch = (searchText: string) => {
  console.log('搜索阀门:', searchText)
  // 模拟搜索阀门数据
  currentValve.value = {
    id: 'V-' + Math.random().toString(36).substr(2, 5),
    name: searchText,
    coordinates: [109.46853429, 36.60192102],
    type: '主阀门',
    status: '正常'
  }

  // 添加操作记录
  operationRecords.value.unshift({
    action: `搜索阀门 ${searchText}`,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  })
}

const handleValveLocate = (valve: any) => {
  console.log('定位阀门:', valve)
  if (valve.coordinates && map) {
    focusOnCoordinates(valve.coordinates)

    // 添加操作记录
    operationRecords.value.unshift({
      action: `定位阀门 ${valve.name}`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      details: `坐标: ${valve.coordinates[1].toFixed(4)}, ${valve.coordinates[0].toFixed(4)}`
    })
  }
}

const generateShutdownNotice = (data: any) => {
  console.log('生成停气通知:', data)

  // 添加操作记录
  operationRecords.value.unshift({
    action: '发送停气通知',
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    details: `通知用户: ${data.analysisResult.affectedUsers} 户`
  })

  // 这里可以调用API生成通知
  ElMessage.success('停气通知生成成功')
}

// 新增：获取路由参数
const route = useRoute()
const currentMenuType = ref('')

// 监听路由参数变化
watch(() => route.query.menuType, (newMenuType) => {
  if (newMenuType) {
    currentMenuType.value = newMenuType as string
    console.log('当前菜单类型:', currentMenuType.value)
  }
}, { immediate: true })

const bottomTableTitle = ref('数据列表')
// 在脚本部分定义表格列配置
const gasColumns = ref([
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '名称', minWidth: 120 },
  {
    prop: 'type',
    label: '类型',
    width: 100,
    slot: 'type' // 使用自定义插槽
  },
  {
    prop: 'status',
    label: '状态',
    width: 80,
    slot: 'status' // 使用自定义插槽
  },
  { prop: 'location', label: '位置', minWidth: 150 },
  { prop: 'updateTime', label: '更新时间', width: 160 },
])

// 不同的数据场景可以使用不同的列配置
const deviceColumns = ref([
  { prop: 'id', label: '设备ID', width: 100 },
  { prop: 'deviceName', label: '设备名称', minWidth: 120 },
  { prop: 'deviceType', label: '设备类型', width: 120 },
  { prop: 'deviceNo', label: '设备编号', width: 100 },
  { prop: 'deviceAddress', label: '设备地址', width: 120 },
])

// 在现有的响应式数据中添加图例面板控制
const showLegendPanel = ref(false)
// 管网类型面板
// 新增响应式数据
const showPipeTypePanel = ref(false)
// 修改管线类型面板位置
const pipeTypePanelPosition = ref({
  right: '20px',
  top: '20px'
})
// 设置面板宽高
const pipeTypePanelSize = ref({
  width: 800,  // 可以自定义宽度
  height: 500  // 可以自定义高度
})

// 处理管网类型筛选变化
const handlePipeTypeFilterChange = (filters: any) => {
  console.log('管网类型筛选变化:', filters)
  // 这里可以根据筛选条件更新地图显示
  updateMapWithPipeFilters(filters)
}

// 处理面板最小化
const handlePipeTypeMinimize = (minimized: boolean) => {
  console.log('管网类型面板最小化:', minimized)
  // 可以在这里添加最小化后的逻辑
}

// 根据筛选条件更新地图
const updateMapWithPipeFilters = (filters: any) => {
  if (!map || !vectorLayer) return

  // 这里可以根据筛选条件更新矢量图层的样式或显示/隐藏某些要素
  console.log('根据筛选条件更新地图显示', filters)

  // 示例：更新图层样式
  const source = vectorLayer.getSource()
  if (source) {
    // 可以根据筛选条件设置不同的样式
    vectorLayer.setStyle((feature) => {
      const featureType = feature.get('type')
      // 根据筛选条件返回不同的样式
      return createPipeStyle(featureType, filters)
    })
  }
}

// 创建管道样式（示例）
const createPipeStyle = (featureType: string, filters: any) => {
  // 根据筛选条件和要素类型创建不同的样式
  // 这里需要根据实际的数据结构来实现
  return new Style({
    stroke: new Stroke({
      color: '#165DFF',
      width: 3
    })
  })
}

// 气源状态面板
// 新增响应式数据
const showGasStatusPanel = ref(false)
const gasStatusPanelWidth = ref(320)

// 气源压力设备数据
const gasStatusDevices = ref<any>(null);

// 气源压力面板事件处理
const handleGasDeviceClick = async (device: any) => {
  console.log('气源压力设备点击:', device)

  // 聚焦到设备位置
  if (device.coordinates && map) {
    focusOnCoordinates(device.coordinates)

    // 显示设备详情弹窗
    await showGasDeviceDetail(device)
  }
}

const handleGasSearch = (keyword: string) => {
  console.log('气源压力搜索:', keyword)
  // 可以在这里添加搜索逻辑
}

const handleGasStatusChange = (status: string) => {
  console.log('气源压力状态变化:', status)
  // 可以在这里添加状态筛选逻辑
}

const exportGasStatusData = () => {
  console.log('导出气源压力数据')
  if (!gasStatusDevices.value) {
    console.warn('没有可导出的气源压力数据')
    return
  }
  const dataToExport = gasStatusDevices.value.map((device: any) => ({
    设备名称: device.name,
    状态: device.status === 'normal' ? '正常' : '异常',
    压力值: device.pressure + ' MPa',
    温度: device.temperature + ' °C'
  }))

  console.log('导出数据:', dataToExport)
  // 实际项目中可以使用第三方库如 xlsx 来导出 Excel
}

// 显示气源设备详情
const showGasDeviceDetail = async (device: any, coordinates?: number[]) => {
  const deviceCoords = coordinates || device.coordinates
  const deviceId = `gas_${device.id}`

  console.log('显示气源设备详情:', device.name, '设备ID:', deviceId)

  // 创建设备数据
  const deviceData = {
    id: deviceId,
    name: device.name,
    type: '压力监测站',
    status: device.status === 'normal' ? '正常' : '异常',
    location: `${deviceCoords[0]?.toFixed(4)}, ${deviceCoords[1]?.toFixed(4)}`,
    updateTime: new Date().toLocaleString('zh-CN'),
    pressure: device.pressure,
    temperature: device.temperature,
    ...device.data
  }

  // 创建图表数据
  const chartData = {
    accumulated: Math.floor(Math.random() * 1000).toString(),
    flowRate: device.pressure,
    temperature: device.temperature,
    pressure: device.pressure,
    temperatureData: Array(6).fill(0).map(() => Math.floor(Math.random() * 50)),
    pressureData: Array(6).fill(0).map(() => (Math.random() * 2).toFixed(2))
  }

  // 创建设备弹窗
  await createDevicePopup(deviceId, deviceData, chartData, deviceCoords)
}




// 设备弹窗管理 - 使用普通对象而不是 Map
interface PopupInfo {
  overlay: Overlay
  element: HTMLElement
  app: any // Vue 应用实例
}

const devicePopups = ref<Record<string, PopupInfo>>({})

// 检查设备弹窗是否存在
const hasDevicePopup = (deviceId: string): boolean => {
  return !!devicePopups.value[deviceId]
}

// 获取设备弹窗
const getDevicePopup = (deviceId: string): PopupInfo | undefined => {
  return devicePopups.value[deviceId]
}

// 设置设备弹窗
const setDevicePopup = (deviceId: string, popupInfo: PopupInfo) => {
  devicePopups.value[deviceId] = popupInfo
}

// 删除设备弹窗
const deleteDevicePopup = (deviceId: string) => {
  delete devicePopups.value[deviceId]
}

// 获取所有设备弹窗ID
const getDevicePopupIds = (): string[] => {
  return Object.keys(devicePopups.value)
}

// 创建设备弹窗
// 创建设备弹窗
const createDevicePopup = async (deviceId: string, deviceData: any, chartData: any, coordinates: number[]) => {
  // 如果弹窗已存在，先移除
  if (hasDevicePopup(deviceId)) {
    removeDevicePopup(deviceId)
  }

  try {
    // 创建弹窗容器 - 移除箭头相关的样式
    const popupElement = document.createElement('div')
    popupElement.className = 'ol-popup'
    popupElement.style.cssText = `
      position: absolute;
      background: white;
      border-radius: 8px;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
      border: 1px solid ${gasBlueTheme.primary};
      width: 350px;
      max-width: 400px;
      min-width: 300px;
      z-index: 1002;
      transform: translate(-50%, -100%);
      cursor: default;
      font-size: 12px;
    `

    // 创建弹窗内容容器
    const popupContent = document.createElement('div')
    popupContent.className = 'popup-content'
    popupContent.style.cssText = `
      max-height: 400px;
      overflow: hidden;
    `

    // 组装弹窗 - 移除箭头元素
    popupElement.appendChild(popupContent)

    // 创建 Overlay - 调整偏移量
    const overlay = new Overlay({
      element: popupElement,
      positioning: 'bottom-center',
      stopEvent: true,
      offset: [0, -8], // 减小偏移量
    })

    // 设置位置
    const pixelCoordinates = fromLonLat(coordinates)
    overlay.setPosition(pixelCoordinates)

    // 添加到地图
    if (map) {
      map.addOverlay(overlay)
    }

    // 使用 Vue 渲染组件内容
    const { createApp } = await import('vue')


    // 创建 Vue 应用
    const app = createApp(DeviceDetailPanel, {
      deviceData,
      chartData,
      themeColors: gasBlueTheme,
      onClose: () => removeDevicePopup(deviceId)
    })


    // 挂载到弹窗内容容器
    app.mount(popupContent)

    // 存储弹窗引用
    const popupInfo: PopupInfo = {
      overlay,
      element: popupElement,
      app
    }

    setDevicePopup(deviceId, popupInfo)

    console.log(`设备弹窗 ${deviceId} 创建成功`)
    return overlay

  } catch (error) {
    console.error('创建设备弹窗失败:', error)
    return null
  }
}

// 移除设备弹窗
const removeDevicePopup = (deviceId: string) => {
  const popupInfo = getDevicePopup(deviceId)
  if (popupInfo) {
    try {
      // 销毁 Vue 应用
      if (popupInfo.app) {
        popupInfo.app.unmount()
      }

      // 从地图移除 Overlay
      if (map && popupInfo.overlay) {
        map.removeOverlay(popupInfo.overlay)
      }

      // 手动移除 DOM 元素
      if (popupInfo.element && popupInfo.element.parentNode) {
        popupInfo.element.parentNode.removeChild(popupInfo.element)
      }

      // 从管理器中移除
      deleteDevicePopup(deviceId)

      console.log(`设备弹窗 ${deviceId} 已完全移除`)
    } catch (error) {
      console.error(`移除设备弹窗 ${deviceId} 失败:`, error)
    }
  }
}

// 移除所有设备弹窗
const removeAllDevicePopups = () => {
  const deviceIds = getDevicePopupIds()
  deviceIds.forEach(deviceId => {
    removeDevicePopup(deviceId)
  })
}

// 更新弹窗位置
const updatePopupPosition = (deviceId: string, coordinates: number[]) => {
  const popupInfo = getDevicePopup(deviceId)
  if (popupInfo && map) {
    const pixelCoordinates = fromLonLat(coordinates)
    popupInfo.overlay.setPosition(pixelCoordinates)
  }
}

// 处理树节点点击
const handleTreeNodeClick = async (nodeData: any) => {
  console.log('树节点点击:', nodeData)

  // 如果节点有坐标数据，聚焦到该位置并显示弹窗
  if (nodeData.data?.coordinates && map) {
    const coordinates = nodeData.data.coordinates
    const deviceId = nodeData.id

    console.log('设备坐标:', coordinates, '设备ID:', deviceId)

    // 聚焦到该位置
    focusOnCoordinates(coordinates)

    // 显示设备详情弹窗（如果是设备节点）
    if (nodeData.type && ['station', 'valve', 'monitor'].includes(nodeData.type)) {
      await showDeviceDetailForNode(nodeData, coordinates, deviceId)
    }
  } else {
    console.warn('节点没有坐标数据或地图未初始化')
  }
}

// 显示设备详情
const showDeviceDetailForNode = async (nodeData: any, coordinates: number[], deviceId: string) => {
  console.log('显示设备详情:', nodeData.label, '设备ID:', deviceId)

  // 创建设备数据
  const deviceData = {
    id: deviceId,
    name: nodeData.label,
    type: getDeviceTypeName(nodeData.type),
    status: '正常',
    location: `${coordinates[0]?.toFixed(4)}, ${coordinates[1]?.toFixed(4)}`,
    updateTime: new Date().toLocaleString('zh-CN')
  }

  // 创建图表数据
  const chartData = {
    accumulated: Math.floor(Math.random() * 1000).toString(),
    flowRate: (Math.random() * 100).toFixed(2),
    temperature: Math.floor(Math.random() * 50).toString(),
    pressure: (Math.random() * 100).toFixed(2),
    temperatureData: Array(6).fill(0).map(() => Math.floor(Math.random() * 50)),
    pressureData: Array(6).fill(0).map(() => Math.floor(Math.random() * 50) + 50)
  }

  // 创建设备弹窗
  await createDevicePopup(deviceId, deviceData, chartData, coordinates)
}

// 获取设备类型名称
const getDeviceTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    'station': '调压站',
    'valve': '阀门',
    'monitor': '监测点',
    'pipeline': '管线'
  }
  return typeMap[type] || '设备'
}

// 聚焦到坐标位置
const focusOnCoordinates = (coordinates: any) => {
  if (!map) return

  const view = map.getView()

  if (Array.isArray(coordinates[0])) {
    // 处理线状要素（管线）
    const extent = new LineString(coordinates.map((coord: number[]) => fromLonLat(coord))).getExtent()
    view.fit(extent, { duration: 500, padding: [50, 50, 50, 50] })
  } else {
    // 处理点状要素
    view.animate({
      center: fromLonLat(coordinates),
      zoom: 15,
      duration: 500
    })
  }
}

// 新增响应式数据
const showLeftPanel = ref(false)
const showBottomPanel = ref(false)
const activeMenu = ref('')

// 面板尺寸控制
const leftPanelWidth = ref(320)
const bottomPanelHeight = ref(300)
const isResizing = ref(false)
const resizeDirection = ref('')

// 燃气行业蓝色主题
const gasBlueTheme = {
  primary: '#1E6FBA',     // 主蓝色
  lightBlue: '#E8F4FE',   // 浅蓝色背景
  darkBlue: '#165B9C',    // 深蓝色
  accentBlue: '#2B8DE3',  // 强调蓝色
  borderBlue: '#B8D9F5'   // 边框蓝色
}

// 计算左侧面板的动态高度
const leftPanelStyle = computed(() => {
  const style: any = {
    width: `${leftPanelWidth.value}px`
  }

  // 当底部面板显示时，计算可用高度
  if (showBottomPanel.value) {
    // 计算底部面板在屏幕上的实际高度（包括边距）
    const bottomPanelVisibleHeight = bottomPanelHeight.value + 40 // 底部面板高度 + 上下边距
    const viewportHeight = window.innerHeight - 64 // 减去Header高度
    const availableHeight = viewportHeight - bottomPanelVisibleHeight - 40 // 减去底部面板高度和顶部边距

    style.height = `${availableHeight}px`
    style.maxHeight = `${availableHeight}px`
  } else {
    style.height = 'calc(100% - 40px)' // 默认高度（上下各20px边距）
  }

  return style
})

// 树形面板样式
const leftTreePanelStyle = computed(() => {
  return getLeftPanelStyle()
})

// 终端设备面板样式
const leftTerminalPanelStyle = computed(() => {
  return getLeftPanelStyle()
})

// 气源状态面板样式
const gasStatusPanelStyle = computed(() => {
  const style: any = {
    width: `${gasStatusPanelWidth.value}px`
  }

  // 使用统一的高度计算方法
  const heightStyle = getLeftPanelStyle()
  style.height = heightStyle.height
  style.maxHeight = heightStyle.maxHeight

  return style
})

// 统一的左侧面板样式计算方法
const getLeftPanelStyle = () => {
  const style: any = {}

  // 根据具体面板设置宽度
  if (currentGasPanel.value === 'status' || currentGasPanel.value === 'analysis' || currentGasPanel.value === 'emergency-command') {
    style.width = `${gasStatusPanelWidth.value}px`
  } else {
    style.width = `${leftPanelWidth.value}px`
  }

  // 计算高度
  if (showBottomPanel.value) {
    const viewportHeight = window.innerHeight
    const headerHeight = 64
    const bottomPanelMargin = 20

    // 计算底部面板占据的总高度
    const bottomPanelTotalHeight = bottomPanelHeight.value + (bottomPanelMargin * 2)

    // 计算可用高度
    const availableHeight = viewportHeight - headerHeight - bottomPanelTotalHeight - 20

    // 设置最小和最大高度限制
    const minHeight = 300 // 最小高度300px
    const maxHeight = 600 // 最大高度600px
    const calculatedHeight = Math.max(minHeight, Math.min(maxHeight, availableHeight))

    style.height = `${calculatedHeight}px`
    style.maxHeight = `${calculatedHeight}px`
  } else {
    // 没有底部面板时，使用视窗高度
    const maxHeight = window.innerHeight - 84 // Header高度64px + 上下边距20px
    style.height = `${maxHeight}px`
    style.maxHeight = `${maxHeight}px`
  }

  return style
}

// 树形结构数据
const treeData = ref([
  {
    id: '1',
    label: '主干管网',
    icon: 'Folder',
    children: [
      {
        id: '1-1',
        label: '北线主干管',
        icon: 'Connection',
        count: 5,
        type: 'pipeline',
        data: { coordinates: [[116.3974, 39.9093], [116.4074, 39.9193]] }
      },
      {
        id: '1-2',
        label: '南线主干管',
        icon: 'Connection',
        count: 3,
        type: 'pipeline',
        data: { coordinates: [[116.4074, 39.9193], [116.4174, 39.9093]] }
      }
    ]
  },
  {
    id: '2',
    label: '设备设施',
    icon: 'Setting',
    children: [
      {
        id: '2-1',
        label: '调压站',
        icon: 'OfficeBuilding',
        count: 8,
        type: 'station',
        data: { coordinates: [116.3974, 39.9093] }
      },
      {
        id: '2-2',
        label: '阀门',
        icon: 'Switch',
        count: 25,
        type: 'valve',
        data: { coordinates: [116.4074, 39.9193] }
      },
      {
        id: '2-3',
        label: '监测点',
        icon: 'Monitor',
        count: 15,
        type: 'monitor',
        data: { coordinates: [116.4174, 39.9093] }
      }
    ]
  },
  {
    id: '3',
    label: '警告信息',
    icon: 'Warning',
    children: [
      {
        id: '3-1',
        label: '压力异常',
        icon: 'Warning',
        count: 2,
        type: 'warning'
      },
      {
        id: '3-2',
        label: '流量异常',
        icon: 'Warning',
        count: 1,
        type: 'warning'
      }
    ]
  }
])

/**
 * 表格数据和列配置
 */
const tableData = ref<any>([])
const tableColumns = ref<any>([])
const popupType = ref('pipeline')
// 表格数据   设备设施
const deviceTableData = ref([
  {
    id: 'D001',
    deviceName: '调压站-A01',
    deviceType: '调压站',
    deviceNo: 'TRZ-A01',
    deviceAddress: '北京市朝阳区建国路88号',
    data: {
      coordinates: [116.4074, 39.9193],
      officialInfo: {
        name: '调压站-A01',
        material: '无缝钢管',
        years: '6年-10年',
        pressureLevel: '中压管道',
        anticorrosion: '普通PE防腐',
        diameter: '钢质DN57',
        other: '-'
      }
    }
  },
  {
    id: 'D002',
    deviceName: '阀门-V001',
    deviceType: '阀门',
    deviceNo: 'FM-V001',
    deviceAddress: '北京市海淀区中关村大街27号',
    data: {
      coordinates: [116.4024, 39.9143],
      officialInfo: {
        name: '阀门-V001',
        material: '镀锌钢管',
        years: '11年-15年',
        pressureLevel: '高压管道',
        anticorrosion: '沥青防腐',
        diameter: '钢质DN32',
        other: '占压管线'
      }
    }
  },
  {
    id: 'D003',
    deviceName: '压力监测点-P001',
    deviceType: '监测点',
    deviceNo: 'YQ-P001',
    deviceAddress: '北京市东城区东直门南大街5号',
    data: {
      coordinates: [116.4174, 39.9093],
      officialInfo: {
        name: '压力监测点-P001',
        material: 'PE管道',
        years: '1年-5年',
        pressureLevel: '低压管道',
        anticorrosion: '抗UV漆',
        diameter: 'PE De32',
        other: '-'
      }
    }
  },
  {
    id: 'D004',
    deviceName: '调压站-A02',
    deviceType: '调压站',
    deviceNo: 'TRZ-A02',
    deviceAddress: '北京市丰台区南四环西路66号',
    data: {
      coordinates: [116.3924, 39.8993],
      officialInfo: {
        name: '调压站-A02',
        material: '无缝钢管',
        years: '6年-10年',
        pressureLevel: '中压管道',
        anticorrosion: '普通PE防腐',
        diameter: '钢质DN57',
        other: '-'
      }
    }
  }
])

// 表格数据   官网分布
const gasData = ref([
  {
    id: '1',
    name: '北线主干管-001',
    type: '管线',
    status: '正常',
    location: '116.3974, 39.9093',
    updateTime: '2024-01-20 10:30:00',
    data: {
      coordinates: [[116.3974, 39.9093], [116.4074, 39.9193]],
      officialInfo: {
        name: '北线主干管-001',
        material: '镀锌钢管',
        years: '1年-5年',
        pressureLevel: '高压管道',
        anticorrosion: '3PE防腐',
        diameter: '钢质DN22',
        other: '停用管线'
      }
    }
  },
  {
    id: '2',
    name: '北线主干管-002',
    type: '管线',
    status: '正常',
    location: '116.4074, 39.9193',
    updateTime: '2024-01-20 09:15:00',
    data: {
      coordinates: [116.4074, 39.9193],
      officialInfo: {
        name: '调压站-A01',
        material: '无缝钢管',
        years: '6年-10年',
        pressureLevel: '中压管道',
        anticorrosion: '普通PE防腐',
        diameter: '钢质DN57',
        other: '-'
      }
    }
  },
  {
    id: '3',
    name: '北线主干管-002',
    type: '管线',
    status: '警告',
    location: '116.4174, 39.9093',
    updateTime: '2024-01-20 11:20:00',
    data: {
      coordinates: [116.4174, 39.9093],
      officialInfo: {
        name: '压力监测点-P001',
        material: 'PE管道',
        years: '1年-5年',
        pressureLevel: '低压管道',
        anticorrosion: '抗UV漆',
        diameter: 'PE De32',
        other: '-'
      }
    }
  },
  {
    id: '4',
    name: '北线主干管-004',
    type: '管线',
    status: '正常',
    location: '116.4024, 39.9143',
    updateTime: '2024-01-20 08:45:00',
    data: {
      coordinates: [116.4024, 39.9143],
      officialInfo: {
        name: '阀门-V001',
        material: '镀锌钢管',
        years: '11年-15年',
        pressureLevel: '高压管道',
        anticorrosion: '沥青防腐',
        diameter: '钢质DN32',
        other: '占压管线'
      }
    }
  }
])

const gasInspectionColumns = ref([
  { prop: 'id', label: '序号', width: 100 },
  { prop: 'name', label: '管网名称', minWidth: 120 },
  { prop: 'InspectionPersonnel', label: '巡检人员', width: 100 },
  { prop: 'inspectionRules', label: '巡检规则', width: 100 },
  { prop: 'status', label: '巡检状态', minWidth: 200, slot: 'status' },
  { prop: 'updateTime', label: '开始时间', width: 160 },
])

const equipmentInspectionColumns = ref([
  { prop: 'id', label: '序号', width: 100 },
  { prop: 'name', label: '设备名称', minWidth: 120 },
  { prop: 'InspectionPersonnel', label: '设备类型', width: 100 },
  { prop: 'inspectionRules', label: '设备编号', width: 100 },
  { prop: 'inspectionRules', label: '设备地址', width: 100 },
  { prop: 'inspectionRules', label: '巡检人员', width: 100 },
  { prop: 'inspectionRules', label: '巡检规则', width: 100 },
  { prop: 'status', label: '巡检状态', minWidth: 200, slot: 'status' },
  { prop: 'updateTime', label: '开始时间', width: 160 },
])

// 服务应急抢险
// 序号、服务应急抢险编号、应急抢险位置、停气碰口位置、管阀阀井位置、影响区域、备注
const emergencyColumns = ref([
  { prop: 'id', label: '序号', width: 80 },
  { prop: 'emergencyNo', label: '应急抢险编号', minWidth: 160 },
  { prop: 'location', label: '应急抢险位置', minWidth: 180 },
  { prop: 'shutoffLocation', label: '停气碰口位置', minWidth: 180 },
  { prop: 'pipeValvePosition', label: '管阀阀井位置', minWidth: 160 },
  { prop: 'impactArea', label: '影响区域', minWidth: 140 },
  { prop: 'remarks', label: '备注', minWidth: 200 },
])

// 工程建设管理
// 序号、工程名称、工程编号、施工单位、工地地址、工地负责人、联系电话、最后看护时间、现状照片、任务分派、备注
const constructionColumns = ref([
  { prop: 'id', label: '序号', width: 80 },
  { prop: 'projectName', label: '工程名称', minWidth: 150 },
  { prop: 'projectNo', label: '工程编号', minWidth: 120 },
  { prop: 'constructionUnit', label: '施工单位', minWidth: 150 },
  { prop: 'siteAddress', label: '工地地址', minWidth: 200 },
  { prop: 'siteManager', label: '工地负责人', minWidth: 120 },
  { prop: 'contactNumber', label: '联系电话', minWidth: 140 },
  { prop: 'lastInspectionTime', label: '最后看护时间', width: 160 },
  { prop: 'currentPhotos', label: '现状照片', minWidth: 200, slot: 'photos' },
  { prop: 'taskAssignment', label: '任务分派', minWidth: 150 },
  { prop: 'remarks', label: '备注', minWidth: 200 },
])

// 服务客服管理
// 序号、客服编号、客服名称、初装时间、改管时间、户数、用户姓名、手机号码、身份证号码、位置信息、备注
const customerServiceColumns = ref([
  { prop: 'id', label: '序号', width: 80 },
  { prop: 'serviceNo', label: '客服编号', minWidth: 120 },
  { prop: 'serviceName', label: '客服名称', minWidth: 150 },
  { prop: 'installationDate', label: '初装时间', width: 120 },
  { prop: 'pipeChangeDate', label: '改管时间', width: 120 },
  { prop: 'households', label: '户数', width: 100 },
  { prop: 'userName', label: '用户姓名', minWidth: 120 },
  { prop: 'phoneNumber', label: '手机号码', minWidth: 140 },
  { prop: 'idNumber', label: '身份证号码', minWidth: 180 },
  { prop: 'locationInfo', label: '位置信息', minWidth: 200 },
  { prop: 'remarks', label: '备注', minWidth: 200 },
])

const customerServiceData = ref([
  {
    id: 'CS001',
    serviceNo: 'KF-20241101-001',
    serviceName: '朝阳区客户服务',
    installationDate: '2020-05-15',
    pipeChangeDate: '2023-08-20',
    households: 150,
    userName: '张三',
    phoneNumber: '13700137000',
    idNumber: '110101199001011234',
    locationInfo: '北京市朝阳区建国路88号',
    remarks: '定期回访，确保用户满意度',
    data: {
      coordinates: [116.4074, 39.9193],
      officialInfo: {
        communityName: '朝阳区客户服务',
        address: '北京市朝阳区建国路88号',
        userName: '张三',
        phoneNumber: '13700137000',
      }
    }
  },
  {
    id: 'CS002',
    serviceNo: 'KF-20251101-002',
    serviceName: '海淀区客户服务',
    installationDate: '2019-03-10',
    pipeChangeDate: '2022-11-05',
    households: 200,
    userName: '李四',
    phoneNumber: '13600136000',
    idNumber: '110102198902022345',
    locationInfo: '北京市海淀区中关村大街27号',
    remarks: '关注老年用户的用气安全',
    data: {
      coordinates: [116.4024, 39.9143],
      officialInfo: {
        communityName: '海淀区客户服务',
        address: '北京市海淀区中关村大街27号',
        userName: '李四',
        phoneNumber: '13600136000',
      }
    }
  }
])

const constructionData = ref([
  {
    id: 'C001',
    projectName: '朝阳区建国路燃气管道改造',
    projectNo: 'GC-20241101-001',
    constructionUnit: '北京燃气建设有限公司',
    siteAddress: '北京市朝阳区建国路88号',
    siteManager: '李四',
    contactNumber: '13800138000',
    lastInspectionTime: '2025-11-05 15:30:00',
    currentPhotos: [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg'
    ],
    taskAssignment: '张三负责现场监护，王五负责安全检查',
    remarks: '施工期间注意交通安全，确保燃气供应不中断',
    data: {
      coordinates: [116.4074, 39.9193],
      officialInfo: {
        projectName: '朝阳区建国路燃气管道改造',
        projectNo: 'GC-20241101-001',
        constructionUnit: '北京燃气建设有限公司',
        siteAddress: '北京市朝阳区建国路88号',
        siteManager: '李四',
        contactNumber: '13800138000',
        lastInspectionTime: '2025-11-05 15:30:00',
        taskAssignment: '张三负责现场监护，王五负责安全检查',
        currentPhotos: [
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg'
        ],
      }
    }
  },
  {
    id: 'C002',
    projectName: '海淀区中关村燃气管道维护',
    projectNo: 'GC-20251101-002',
    constructionUnit: '北京燃气维护有限公司',
    siteAddress: '北京市海淀区中关村大街27号',
    siteManager: '王五',
    contactNumber: '13900139000',
    lastInspectionTime: '2025-11-06 10:20:00',
    currentPhotos: [
      'https://example.com/photo3.jpg',
      'https://example.com/photo4.jpg'
    ],
    taskAssignment: '赵六负责现场监护，钱七负责安全检查',
    remarks: '维护期间注意周边环境保护，防止二次污染',
    data: {
      coordinates: [116.4024, 39.9143],
      officialInfo: {
        projectName: '海淀区中关村燃气管道维护',
        projectNo: 'GC-20251101-002',
        constructionUnit: '北京燃气维护有限公司',
        siteAddress: '北京市海淀区中关村大街27号',
        siteManager: '王五',
        contactNumber: '13900139000',
        lastInspectionTime: '2025-11-06 10:20:00',
        taskAssignment: '赵六负责现场监护，钱七负责安全检查',
        currentPhotos: [
          'https://example.com/photo3.jpg',
          'https://example.com/photo4.jpg'
        ],
      }
    }
  }
])

const emergencyData = ref([
  {
    id: 'E001',
    emergencyNo: 'EQ-20241101-001',
    location: '朝阳区建国路与光华路交叉口北侧',
    shutoffLocation: '建国路西侧 DN150 停气碰口',
    pipeValvePosition: '阀井-VN-102（距路口50m）',
    impactArea: '周边居民楼 3 栋，商业区若干',
    status: '处理中',
    remarks: '现场人员已到达，正在处置',
    updateTime: '2025-11-07 09:12:00',
    data: {
      coordinates: [116.4074, 39.9193],
      officialInfo: {
        reporter: '调度中心',
        reportedAt: '2025-11-07 08:50:00',
        severity: '中',
        suggestedAction: '关闭阀门并临时供气方案',
        photos: []
      }
    }
  },
  {
    id: 'E002',
    emergencyNo: 'EQ-20251101-002',
    location: '海淀区中关村大街27号北侧',
    shutoffLocation: '沟渠侧 DN100 停气点',
    pipeValvePosition: '阀井-FM-210（路南10m）',
    impactArea: '影响学校与周边小区',
    status: '已完成',
    remarks: '抢修完成，已恢复供气',
    updateTime: '2025-11-06 18:45:00',
    data: {
      coordinates: [116.4024, 39.9143],
      details: {
        reporter: '现场队',
        reportedAt: '2025-11-06 16:20:00',
        severity: '高',
        suggestedAction: '临时切换供气、修复破损段',
        photos: []
      }
    }
  }
])

// 表格数据   巡检数据
const inspectionData = ref([
  {
    id: '1',                              // 序号
    name: '北线主干管-001',                // 名称
    InspectionPersonnel: '曹栋梁',        // 巡检人员
    inspectionRules: '日常巡检',          // 巡检规则
    status: '正常',                      // 状态
    location: '116.3974, 39.9093',
    updateTime: '2024-01-20 10:30:00',
    data: {
      coordinates: [[116.3974, 39.9093], [116.4074, 39.9193]],
      officialInfo: {
        // 记录名称、类型、状态、管网名称、管网类型、处理人、处理时间、定位坐标、我的当前位置、地理位置描述、处理内容、备注
        "recordName": "压力异常记录-P001",
        "type": "压力异常",
        "status": "已处理",
        "networkName": "北线主干管-001",
        "networkType": "高压管道",
        "handler": "张三",
        "handledAt": "2024-01-20 12:05:00",
        "coordinates": [116.3974, 39.9093],
        "myLocation": "116.3975, 39.9094",
        "locationDesc": "主干管线与辅路交叉口北侧50米处",
        "actionTaken": "现场更换密封圈并复压，压力恢复至正常范围",
        "remarks": "需7天内复查并记录结果"
      }
    }
  },
  {
    id: '2',
    name: '北线主干管-002',
    InspectionPersonnel: '曹栋梁',        // 巡检人员
    inspectionRules: '日常巡检',          // 巡检规则
    status: '正常',
    location: '116.4074, 39.9193',
    updateTime: '2024-01-20 09:15:00',
    data: {
      coordinates: [116.4074, 39.9193],
      officialInfo: {
        "recordName": "压力异常记录-P001",
        "type": "压力异常",
        "status": "已处理",
        "networkName": "北线主干管-001",
        "networkType": "高压管道",
        "handler": "张三",
        "handledAt": "2024-01-20 12:05:00",
        "coordinates": [116.3974, 39.9093],
        "myLocation": "116.3975, 39.9094",
        "locationDesc": "主干管线与辅路交叉口北侧50米处",
        "actionTaken": "现场更换密封圈并复压，压力恢复至正常范围",
        "remarks": "需7天内复查并记录结果"
      }
    }
  },
  {
    id: '3',
    name: '北线主干管-002',
    InspectionPersonnel: '曹栋梁',        // 巡检人员
    inspectionRules: '日常巡检',          // 巡检规则
    status: '警告',
    location: '116.4174, 39.9093',
    updateTime: '2024-01-20 11:20:00',
    data: {
      coordinates: [116.4174, 39.9093],
      officialInfo: {
        "recordName": "压力异常记录-P001",
        "type": "压力异常",
        "status": "已处理",
        "networkName": "北线主干管-001",
        "networkType": "高压管道",
        "handler": "张三",
        "handledAt": "2024-01-20 12:05:00",
        "coordinates": [116.3974, 39.9093],
        "myLocation": "116.3975, 39.9094",
        "locationDesc": "主干管线与辅路交叉口北侧50米处",
        "actionTaken": "现场更换密封圈并复压，压力恢复至正常范围",
        "remarks": "需7天内复查并记录结果"
      }
    }
  },
  {
    id: '4',
    name: '北线主干管-004',
    InspectionPersonnel: '曹栋梁',        // 巡检人员
    inspectionRules: '日常巡检',          // 巡检规则
    status: '正常',
    location: '116.4024, 39.9143',
    updateTime: '2024-01-20 08:45:00',
    data: {
      coordinates: [116.4024, 39.9143],
      officialInfo: {
        "recordName": "压力异常记录-P001",
        "type": "压力异常",
        "status": "已处理",
        "networkName": "北线主干管-001",
        "networkType": "高压管道",
        "handler": "张三",
        "handledAt": "2024-01-20 12:05:00",
        "coordinates": [116.3974, 39.9093],
        "myLocation": "116.3975, 39.9094",
        "locationDesc": "主干管线与辅路交叉口北侧50米处",
        "actionTaken": "现场更换密封圈并复压，压力恢复至正常范围",
        "remarks": "需7天内复查并记录结果"
      }
    }
  }
])

const deviceData = ref([
  {
    id: '1',                              // 序号
    name: '设备-001',                // 名称
    equipmentType: '调压站',          // 设备类型
    equipmentNo: 'TRZ-A01',           // 设备编号
    equipmentAddress: '北京市朝阳区建国路88号', // 设备地址
    InspectionPersonnel: '曹栋梁',        // 巡检人员
    inspectionRules: '日常巡检',          // 巡检规则
    status: '正常',                      // 状态
    location: '116.3974, 39.9093',
    updateTime: '2024-01-20 10:30:00',
    data: {
      coordinates: [[116.3974, 39.9093], [116.4074, 39.9193]],
      officialInfo: {
        // 设备名称、设备类型、设备编号、设备地址、状态、处理人、处理时间、定位坐标、我的当前位置、地理位置描述、处理内容、备注
        "deviceName": "调压站-A01",
        "deviceType": "调压站",
        "deviceNo": "TRZ-A01",
        "deviceAddress": "北京市朝阳区建国路88号",
        "status": "正常",
        "handler": "李四",
        "handledAt": "2024-01-20 12:30:00",
        "coordinates": [116.3974, 39.9093],
        "myLocation": "116.3975, 39.9094",
        "locationDesc": "建国路与光华路交叉口东侧100米处",
        "actionTaken": "设备运行正常，无异常情况",
        "remarks": "下次巡检时间：2024-01-27"
      }
    }
  },
  {
    id: '2',
    name: '设备-002',
    equipmentType: '调压站',          // 设备类型
    equipmentNo: 'TRZ-A01',           // 设备编号
    equipmentAddress: '北京市朝阳区建国路88号', // 设备地址
    InspectionPersonnel: '曹栋梁',        // 巡检人员
    inspectionRules: '日常巡检',          // 巡检规则
    status: '正常',
    location: '116.4074, 39.9193',
    updateTime: '2024-01-20 09:15:00',
    data: {
      coordinates: [116.4074, 39.9193],
      officialInfo: {
        "deviceName": "调压站-A01",
        "deviceType": "调压站",
        "deviceNo": "TRZ-A01",
        "deviceAddress": "北京市朝阳区建国路88号",
        "status": "正常",
        "handler": "李四",
        "handledAt": "2024-01-20 12:30:00",
        "coordinates": [116.4074, 39.9193],
        "myLocation": "116.3975, 39.9094",
        "locationDesc": "建国路与光华路交叉口东侧100米处",
        "actionTaken": "设备运行正常，无异常情况",
        "remarks": "下次巡检时间：2024-01-27"
      }
    }
  },
  {
    id: '3',
    name: '设备-003',
    equipmentType: '调压站',          // 设备类型
    equipmentNo: 'TRZ-A01',           // 设备编号
    equipmentAddress: '北京市朝阳区建国路88号', // 设备地址
    InspectionPersonnel: '曹栋梁',        // 巡检人员
    inspectionRules: '日常巡检',          // 巡检规则
    status: '警告',
    location: '116.4174, 39.9093',
    updateTime: '2024-01-20 11:20:00',
    data: {
      coordinates: [116.4174, 39.9093],
      officialInfo: {
        "deviceName": "调压站-A01",
        "deviceType": "调压站",
        "deviceNo": "TRZ-A01",
        "deviceAddress": "北京市朝阳区建国路88号",
        "status": "正常",
        "handler": "李四",
        "handledAt": "2024-01-20 12:30:00",
        "coordinates": [116.3974, 39.9093],
        "myLocation": "116.3975, 39.9094",
        "locationDesc": "建国路与光华路交叉口东侧100米处",
        "actionTaken": "设备运行正常，无异常情况",
        "remarks": "下次巡检时间：2024-01-27"
      }
    }
  },
  {
    id: '4',
    name: '设备-004',
    equipmentType: '调压站',          // 设备类型
    equipmentNo: 'TRZ-A01',           // 设备编号
    equipmentAddress: '北京市朝阳区建国路88号', // 设备地址
    InspectionPersonnel: '曹栋梁',        // 巡检人员
    inspectionRules: '日常巡检',          // 巡检规则
    status: '正常',
    location: '116.4024, 39.9143',
    updateTime: '2024-01-20 08:45:00',
    data: {
      coordinates: [116.4024, 39.9143],
      officialInfo: {
        "deviceName": "调压站-A01",
        "deviceType": "调压站",
        "deviceNo": "TRZ-A01",
        "deviceAddress": "北京市朝阳区建国路88号",
        "status": "正常",
        "handler": "李四",
        "handledAt": "2024-01-20 12:30:00",
        "coordinates": [116.4024, 39.9143],
        "myLocation": "116.3975, 39.9094",
        "locationDesc": "建国路与光华路交叉口东侧100米处",
        "actionTaken": "设备运行正常，无异常情况",
        "remarks": "下次巡检时间：2024-01-27"
      }
    }
  }
])

const tableLoading = ref(false)

// 修改菜单点击处理，根据菜单类型执行不同逻辑
const handleMenuClick = (menuKey: string) => {
  console.log('菜单点击:', menuKey, '当前菜单类型:', currentMenuType.value)

  // 根据不同的菜单类型执行不同的逻辑
  switch (currentMenuType.value) {
    case 'pipe-network':
      handlePipeNetworkMenu(menuKey)
      break
    case 'inspection':
      handleInspectionMenu(menuKey)
      break
    case 'engineering':
      handleEngineeringMenu(menuKey)
      break
    case 'customer-service':
      handleCustomerServiceMenu(menuKey)
      break
    default:
      handleDefaultMenu(menuKey)
  }
}

// 在现有的响应式数据中修改
const showGasPanel = ref(false) // 统一控制面板显示
// 面板类型定义
const currentGasPanel = ref<'status' | 'analysis' | 'emergency-command' | 'terminal-equipment'>('status')

// 面板标题计算
const gasPanelTitle = computed(() => {
  const titles = {
    'status': '气源压力运行',
    'analysis': '关阀分析',
    'emergency-command': '应急抢险',
    'terminal-equipment': '终端设备管理'
  }
  return titles[currentGasPanel.value] || '气源压力运行'
})

const legendItems = ref<any>([])
const legendTitle = ref('设备图例')

const terminalEquipmentRef = ref()
const terminalStatsRef = ref()
const currentBottomPanel = ref('')

// 管网管理菜单处理
// 在 handlePipeNetworkMenu 方法中修改终端设备菜单处理
const handlePipeNetworkMenu = (menuKey: string) => {
  activeMenu.value = menuKey
  switch (menuKey) {
    case '/pipe-network/terminal-equipment': // 终端设备管理
      // 显示在气源压力面板区域
      currentGasPanel.value = 'terminal-equipment'
      showGasPanel.value = true
      // 显示底部统计面板
      showBottomPanel.value = true
      currentBottomPanel.value = 'terminal-stats'
      bottomTableTitle.value = '终端设备统计'
      // 隐藏其他左侧面板
      showLeftPanel.value = false
      break

    case '/pipe-network/gas-source':
    case '/pipe-network/end-point':
      currentGasPanel.value = 'status'
      showGasPanel.value = true
      // 隐藏底部面板
      showBottomPanel.value = false
      break

    case '/pipe-network/valve-analysis':
      currentGasPanel.value = 'analysis'
      showGasPanel.value = true
      // 隐藏底部面板
      showBottomPanel.value = false
      break

    case '/pipe-network/distribution':
      showPipeTypePanel.value = !showPipeTypePanel.value
      showBottomPanel.value = !showBottomPanel.value
      currentBottomPanel.value = 'pipe-distribution'
      tableColumns.value = gasColumns.value
      tableData.value = gasData.value
      currentBottomPanel.value = ''
      // 隐藏气源面板
      showGasPanel.value = false
      break

    case '/pipe-network/equipment':
      bottomTableTitle.value = '设备设施列表'
      legendItems.value = [
        { id: 1, name: '调压箱', selected: false, color: '#1E6FBA', icon: Box, count: 5 },
        { id: 2, name: '调压柜', selected: true, color: '#FF6B6B', icon: Box, count: 3 },
        { id: 3, name: '撬装柜', selected: false, color: '#4ECDC4', icon: SetUp, count: 3 },
        { id: 4, name: '阀门', selected: false, color: '#45B7D1', icon: Switch, count: 3 },
        { id: 5, name: '流量计', selected: false, color: '#FFA07A', icon: DataLine, count: 3 },
        { id: 6, name: '压力计', selected: false, color: '#98D8C8', icon: Monitor, count: 3 },
        { id: 7, name: '场站', selected: false, color: '#9B59B6', icon: OfficeBuilding, count: 3 }
      ]
      showLegendPanel.value = true
      showBottomPanel.value = true
      currentBottomPanel.value = 'device-equipment'
      tableColumns.value = deviceColumns.value
      tableData.value = deviceTableData.value
      currentBottomPanel.value = ''
      // 隐藏气源面板
      showGasPanel.value = false
      break
  }

  setTimeout(() => {
    map?.updateSize()
  }, 100)
}

// 终端设备相关方法
const handleTerminalDeviceClick = (device: any) => {
  console.log('终端设备点击:', device)

  // 聚焦到设备位置
  if (device.coordinates && map) {
    focusOnCoordinates(device.coordinates)

    // 显示设备详情弹窗
    showTerminalDeviceDetail(device)
  }
}

const refreshTerminalData = () => {
  if (terminalEquipmentRef.value) {
    terminalEquipmentRef.value.refreshData()
  }
}

const refreshGasStatusData = () => {
  console.log('刷新气源压力数据')
  // 这里可以调用API刷新气源数据
}

const showTerminalDeviceDetail = async (device: any) => {
  console.log('显示终端设备详情:', device.name)

  // 创建设备数据
  const deviceData = {
    id: `terminal_${device.id}`,
    name: device.name,
    type: getTerminalDeviceType(device.type),
    status: device.status,
    location: device.location,
    updateTime: new Date().toLocaleString('zh-CN'),
    ...device
  }

  // 创建图表数据
  const chartData = {
    accumulated: Math.floor(Math.random() * 1000).toString(),
    flowRate: device.flow ? parseFloat(device.flow) : (Math.random() * 10).toFixed(2),
    temperature: device.temperature ? parseFloat(device.temperature) : Math.floor(Math.random() * 50),
    pressure: device.pressure ? parseFloat(device.pressure) : (Math.random() * 5).toFixed(2),
    temperatureData: Array(6).fill(0).map(() => Math.floor(Math.random() * 50)),
    pressureData: Array(6).fill(0).map(() => (Math.random() * 5).toFixed(2))
  }

  // 创建设备弹窗
  await createDevicePopup(deviceData.id, deviceData, chartData, device.coordinates)
}

const getTerminalDeviceType = (type: string) => {
  const typeMap: Record<string, string> = {
    '燃气表': '燃气计量终端',
    '压力传感器': '压力监测终端',
    '流量传感器': '流量监测终端',
    '阀门控制器': '阀门控制终端'
  }
  return typeMap[type] || '终端设备'
}

// 巡检管理菜单处理
const handleInspectionMenu = (menuKey: string) => {
  console.log('巡检管理菜单点击:', menuKey)
  // 这里添加巡检管理相关的面板控制逻辑
  // 例如：显示巡检任务面板、巡检路线面板等
  switch (menuKey) {
    case '/inspection/tasks':
      // 显示巡检任务面板
      bottomTableTitle.value = '市政管网列表'
      showBottomPanel.value = !showBottomPanel.value
      currentBottomPanel.value = 'inspection-tasks'
      tableColumns.value = gasInspectionColumns.value
      tableData.value = inspectionData.value
      popupType.value = 'inspection'
      break
    case '/inspection/courtyard':
      // 显示巡检路线面板
      bottomTableTitle.value = '庭院管网列表'
      showBottomPanel.value = !showBottomPanel.value
      currentBottomPanel.value = 'inspection-courtyard'
      tableColumns.value = gasInspectionColumns.value
      tableData.value = inspectionData.value
      popupType.value = 'inspection'
      break
    case '/inspection/HouseholdSafetyInspection':
      // 显示巡检报告面板
      bottomTableTitle.value = '庭院管网列表'
      showBottomPanel.value = !showBottomPanel.value
      currentBottomPanel.value = 'inspection-household'
      tableColumns.value = gasInspectionColumns.value
      tableData.value = inspectionData.value
      popupType.value = 'inspection'
      break
    case '/inspection/equipments':
      // 显示巡检报告面板
      bottomTableTitle.value = '设备设施列表'
      showBottomPanel.value = !showBottomPanel.value
      currentBottomPanel.value = 'inspection-equipments'
      tableColumns.value = equipmentInspectionColumns.value
      tableData.value = deviceData.value
      popupType.value = 'equipments'
      break
  }
}

// 工程管理菜单处理
const handleEngineeringMenu = (menuKey: string) => {
  console.log('工程管理菜单点击:', menuKey)
  // 这里添加工程管理相关的面板控制逻辑
  switch (menuKey) {
    case '/engineering/emergency':
      // 显示应急抢险面板
      bottomTableTitle.value = '服务应急抢险列表'
      showBottomPanel.value = !showBottomPanel.value
      currentBottomPanel.value = 'engineering-emergency'
      tableColumns.value = emergencyColumns.value
      tableData.value = emergencyData.value
      break
    case '/engineering/engineeringManagement':
      // 显示工程进度面板
      bottomTableTitle.value = '工程建设管理列表'
      showBottomPanel.value = !showBottomPanel.value
      currentBottomPanel.value = 'engineering-management'
      tableColumns.value = constructionColumns.value
      tableData.value = constructionData.value
      popupType.value = 'construction'
      break
    case '/engineering/emergency-command':
      // 显示应急抢险面板
      currentGasPanel.value = 'emergency-command'
      showGasPanel.value = true
      // 显示右侧预警面板
      currentRightPanel.value = 'warning'
      showRightPanel.value = true
      break
  }
}

// 客服管理菜单处理
const handleCustomerServiceMenu = (menuKey: string) => {
  console.log('客服管理菜单点击:', menuKey)
  // 这里添加客服管理相关的面板控制逻辑
  switch (menuKey) {
    case '/customer/service':
      // 显示服务客服面板
      legendItems.value = [
        { id: 1, name: '小区', selected: false, color: '#1E6FBA', icon: Box, count: 5 },
        { id: 2, name: '商业', selected: true, color: '#FF6B6B', icon: Box, count: 3 },
        { id: 3, name: '学校', selected: false, color: '#4ECDC4', icon: SetUp, count: 3 },
        { id: 4, name: '医院', selected: false, color: '#45B7D1', icon: Switch, count: 3 },
      ]
      legendTitle.value = '楼栋图例'
      showLegendPanel.value = true
      bottomTableTitle.value = '工程建设管理列表'
      showBottomPanel.value = !showBottomPanel.value
      currentBottomPanel.value = 'customer-service'
      tableColumns.value = customerServiceColumns.value
      tableData.value = customerServiceData.value
      popupType.value = 'customerService'
      break
    case '/customer/info':
      // 显示用户信息面板
      break
    case '/customer/consultation':
      // 显示咨询管理面板
      break
  }
}

// 默认菜单处理
const handleDefaultMenu = (menuKey: string) => {
  console.log('默认菜单处理:', menuKey)
  // 原有的处理逻辑
  activeMenu.value = menuKey
  // ... 原有逻辑
}

// 处理树节点点击
// const handleTreeNodeClick = (nodeData: any) => {
//   console.log('树节点点击:', nodeData)

//   // 如果节点有坐标数据，聚焦到该位置
//   if (nodeData.data?.coordinates && map) {
//     focusOnCoordinates(nodeData.data.coordinates)
//   }
// }

// 应急抢险相关数据
const currentLeakData = ref<any>(null)
const rescueRecords = ref<any[]>([
  {
    title: '管道泄漏抢险',
    time: '今天 09:23',
    location: '建国路与长安街交叉口',
    status: '已处理'
  },
  {
    title: '阀门故障处理',
    time: '昨天 16:45',
    location: '西城区平安大街',
    status: '已处理'
  },
  {
    title: '管线第三方破坏',
    time: '2023-06-12',
    location: '朝阳区建国路',
    status: '已处理'
  }
])

// 应急抢险相关方法
const handleLocationMethodChange = (method: string) => {
  console.log('定位方式变更:', method)
}

const handleCoordinateInput = (coordinates: { latitude: string; longitude: string }) => {
  console.log('坐标输入:', coordinates)
  currentLeakData.value = {
    ...currentLeakData.value,
    ...coordinates
  }
}

const handleGPSGet = (coordinates: { latitude: string; longitude: string }) => {
  console.log('GPS获取坐标:', coordinates)
  currentLeakData.value = {
    ...currentLeakData.value,
    ...coordinates,
    locationMethod: 'gps'
  }

  ElMessage.success('GPS坐标获取成功')
}

const handleLeakDescribe = (description: string) => {
  console.log('漏点描述:', description)
  currentLeakData.value = {
    ...currentLeakData.value,
    description
  }
}

const handleLocateLeak = (leakData: any) => {
  console.log('定位漏点:', leakData)

  // 在地图上定位漏点
  if (leakData.latitude && leakData.longitude && map) {
    const coordinates = [parseFloat(leakData.longitude), parseFloat(leakData.latitude)]
    focusOnCoordinates(coordinates)

    // 添加抢险记录
    rescueRecords.value.unshift({
      title: '漏点定位',
      time: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      location: `纬度: ${leakData.latitude}, 经度: ${leakData.longitude}`,
      status: '处理中'
    })

    ElMessage.success('漏点定位成功')
  }
}

const handleAnalyzeImpact = (leakData: any) => {
  console.log('分析影响区域:', leakData)

  // 模拟影响分析
  setTimeout(() => {
    ElMessage.success('影响分析完成')

    // 更新记录状态
    const latestRecord = rescueRecords.value[0]
    if (latestRecord && latestRecord.status === '处理中') {
      latestRecord.status = '已分析'
      latestRecord.title = '漏点影响分析'
    }
  }, 2000)
}
// 新增响应式数据
const showWarningPanel = ref(false)
const warningPanelWidth = ref(350)

// 预警面板样式
const warningPanelStyle = computed(() => {
  const style: any = {
    width: `${warningPanelWidth.value}px`
  }

  if (showBottomPanel.value && showWarningPanel.value) {
    const bottomPanelVisibleHeight = bottomPanelHeight.value + 40
    style.height = `calc(100% - ${bottomPanelVisibleHeight}px)`
  } else {
    style.height = 'calc(100% - 40px)'
  }

  return style
})

// 预警信息相关数据
const currentWarningData = ref<any>({
  title: '紧急通知：XX区域管道泄漏抢修',
  level: 'highest',
  content: '紧急通知：位于XX路与XX街交叉口发生管道泄漏，我公司已紧急派出抢险队伍前往处理。',
  channels: ['internal', 'command', 'rescue']
})

const relatedPersons = ref<any[]>([
  {
    id: '1',
    name: '张经理',
    position: '运营部主管',
    type: 'manager'
  },
  {
    id: '2',
    name: '李工',
    position: '技术部负责人',
    type: 'manager'
  },
  {
    id: '3',
    name: '王主管',
    position: '抢险队伍人员',
    type: 'manager'
  },
  {
    id: '4',
    name: '赵队长',
    position: '抢险一队',
    status: '待命',
    type: 'rescue'
  },
  {
    id: '5',
    name: '孙队员',
    position: '抢险二队',
    status: '待命',
    type: 'rescue'
  }
])

// 预警信息相关方法
const handleWarningTitleChange = (title: string) => {
  console.log('预警标题变更:', title)
  currentWarningData.value.title = title
}

const handleWarningLevelChange = (level: string) => {
  console.log('预警级别变更:', level)
  currentWarningData.value.level = level
}

const handleWarningContentChange = (content: string) => {
  console.log('预警内容变更:', content)
  currentWarningData.value.content = content
}

const handleWarningChannelChange = (channels: string[]) => {
  console.log('推送渠道变更:', channels)
  currentWarningData.value.channels = channels
}

const saveWarningDraft = (warningData: any) => {
  console.log('保存草稿:', warningData)
  ElMessage.success('预警信息已保存为草稿')
}

const sendWarningDirect = (warningData: any) => {
  console.log('直接发送:', warningData)
  ElMessage.success('预警信息已发送')
}

const forwardWarningApproval = (warningData: any) => {
  console.log('转发审批:', warningData)
  ElMessage.success('预警信息已提交审批')
}

// 添加右侧面板的拖拽调整大小
const startResize = (direction: string) => {
  isResizing.value = true
  resizeDirection.value = direction

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.value) return

    if (direction === 'left') {
      leftPanelWidth.value = Math.max(280, Math.min(500, e.clientX))
    } else if (direction === 'right') {
      // 右侧面板调整
      const windowWidth = window.innerWidth
      rightPanelWidth.value = Math.max(300, Math.min(500, windowWidth - e.clientX))
    } else if (direction === 'bottom') {
      const windowHeight = window.innerHeight
      const newHeight = Math.max(200, Math.min(400, windowHeight - e.clientY))
      bottomPanelHeight.value = newHeight
    }
  }

  const handleMouseUp = () => {
    isResizing.value = false
    resizeDirection.value = ''
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    // 调整地图大小
    setTimeout(() => {
      map?.updateSize()
    }, 50)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}


// 定义不同数据类型的弹窗配置
const popupConfigs: any = {
  // 管网信息弹窗配置
  pipeline: {
    title: '管网信息',
    titleIcon: 'Connection',
    displayType: 'table',
    minWidth: '350px',
    maxWidth: '500px',
    labelWidth: '100px',
    fields: [
      { key: 'name', label: '管网名称', path: 'data.officialInfo.name', highlight: true },
      { key: 'material', label: '管网材质', path: 'data.officialInfo.material' },
      { key: 'years', label: '使用年限', path: 'data.officialInfo.years' },
      { key: 'pressureLevel', label: '压力等级', path: 'data.officialInfo.pressureLevel' },
      { key: 'anticorrosion', label: '防腐材料', path: 'data.officialInfo.anticorrosion' },
      { key: 'diameter', label: '管径', path: 'data.officialInfo.diameter' },
      { key: 'other', label: '其他', path: 'data.officialInfo.other' }
    ],
    actions: [
      { key: 'viewDetail', label: '查看详情', type: 'primary', icon: 'View' },
      { key: 'edit', label: '编辑信息', type: 'warning', icon: 'Edit' }
    ]
  },

  // 设备信息弹窗配置
  device: {
    title: '设备信息',
    titleIcon: 'Monitor',
    displayType: 'cards',
    minWidth: '400px',
    fields: [
      { key: 'name', label: '设备名称', highlight: true },
      { key: 'type', label: '设备类型' },
      { key: 'status', label: '运行状态', slot: 'status' },
      { key: 'pressure', label: '当前压力', unit: 'MPa' },
      { key: 'temperature', label: '温度', unit: '°C' },
      { key: 'flowRate', label: '流量', unit: 'm³/h' },
      { key: 'location', label: '位置' },
      { key: 'updateTime', label: '更新时间' }
    ],
    actions: [
      { key: 'monitor', label: '实时监控', type: 'primary' },
      { key: 'history', label: '历史数据', type: 'info' }
    ]
  },

  // 巡检信息弹窗配置  记录名称、类型、状态、管网名称、管网类型、处理人、处理时间、定位坐标、我的当前位置、地理位置描述、处理内容、备注
  inspection: {
    title: '巡检记录详情',
    titleIcon: 'Warning',
    // subtitle: '需要及时处理',
    displayType: 'table',
    minWidth: '380px',
    fields: [
      { key: 'recordName', label: '记录名称', highlight: true },
      { key: 'status', label: '状态' },
      { key: 'networkName', label: '管网名称', slot: 'warningLevel' },
      { key: 'networkType', label: '管网类型' },
      { key: 'handler', label: '处理人' },
      { key: 'handledAt', label: '处理时间' },
      { key: 'coordinates', label: '定位坐标' },
      { key: 'myLocation', label: '我的当前位置' },
      { key: 'locationDesc', label: '地理位置描述' },
      { key: 'actionTaken', label: '处理内容' },
      { key: 'remarks', label: '备注' }
    ],
    // actions: [
    //   { key: 'confirm', label: '确认告警', type: 'warning' },
    //   { key: 'handle', label: '立即处理', type: 'danger' },
    //   { key: 'ignore', label: '忽略', type: 'info' }
    // ]
  },

  equipments: {
    title: '设备巡检详情',
    titleIcon: 'Monitor',
    // subtitle: '需要及时处理',
    displayType: 'table',
    minWidth: '380px',
    fields: [
      { key: 'deviceName', label: '设备名称', highlight: true },
      { key: 'deviceType', label: '设备类型' },
      { key: 'deviceNo', label: '设备编号' },
      { key: 'deviceAddress', label: '设备地址' },
      { key: 'status', label: '状态' },
      { key: 'handler', label: '处理人' },
      { key: 'handledAt', label: '处理时间' },
      { key: 'coordinates', label: '定位坐标' },
      { key: 'myLocation', label: '我的当前位置' },
      { key: 'locationDesc', label: '地理位置描述' },
      { key: 'actionTaken', label: '处理内容' },
      { key: 'remarks', label: '备注' }
    ],
    // actions: [
    //   { key: 'confirm', label: '确认告警', type: 'warning' },
    //   { key: 'handle', label: '立即处理', type: 'danger' },
    //   { key: 'ignore', label: '忽略', type: 'info' }
    // ]
  },

  // 服务应急抢险弹窗配置

  // 工程建设管理弹窗配置
  // 确保工程建设管理配置中的 currentPhotos 字段使用 photos 插槽
  construction: {
    title: '工程建设详情',
    titleIcon: 'Monitor',
    displayType: 'table',
    minWidth: '400px',
    fields: [
      { key: 'projectName', label: '工程名称', highlight: true },
      { key: 'projectNo', label: '工程编号' },
      { key: 'constructionUnit', label: '施工单位' },
      { key: 'siteAddress', label: '工地地址' },
      { key: 'siteManager', label: '工地负责人' },
      { key: 'contactNumber', label: '联系电话' },
      { key: 'lastInspectionTime', label: '最后看护时间' },
      { key: 'taskAssignment', label: '任务分派' },
      {
        key: 'currentPhotos',
        label: '现状照片',
        slot: 'photos', // 使用 photos 插槽
        width: '200px'
      }
    ],
    actions: [
      { key: 'viewDetail', label: '查看详情', type: 'primary' }
    ]
  },

  // 客服服务弹窗配置
  // 小区名称、地址、用户、联系电话
  customerService: {
    title: '客服服务详情',
    titleIcon: 'ChatDotRound',
    displayType: 'table',
    minWidth: '350px',
    fields: [
      { key: 'communityName', label: '小区名称', highlight: true },
      { key: 'address', label: '地址' },
      { key: 'user', label: '用户' },
      { key: 'contactNumber', label: '联系电话' }
    ],
    actions: [
      { key: 'viewDetail', label: '查看详情', type: 'primary' }
    ]
  },

}

// 在显示弹窗时根据数据类型选择配置
const showOfficialInfoPopup = async (officialInfo: any, coordinates: any, dataType: string = 'pipeline') => {
  const popupId = `dynamic_popup_${Date.now()}`

  try {
    // 根据数据类型获取配置
    const config = popupConfigs[dataType] || popupConfigs.pipeline
    console.log(dataType, config)

    // 创建弹窗容器
    const popupElement = document.createElement('div')
    popupElement.className = 'ol-popup dynamic-popup-container'
    popupElement.style.cssText = `
      position: absolute;
      background: white;
      border-radius: 8px;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
      border: 1px solid ${gasBlueTheme.primary};
      z-index: 1003;
      transform: translate(-50%, -100%);
      cursor: default;
      font-size: 12px;
      overflow: hidden;
    `

    // 创建弹窗内容容器
    const popupContent = document.createElement('div')
    popupContent.className = 'popup-content'
    popupContent.style.cssText = `
      max-height: 600px;
      overflow: hidden;
    `

    // 组装弹窗
    popupElement.appendChild(popupContent)

    // 创建 Overlay
    const overlay = new Overlay({
      element: popupElement,
      positioning: 'bottom-center',
      stopEvent: true,
      offset: [0, -10],
    })

    // 设置位置
    let pixelCoordinates
    if (Array.isArray(coordinates) && Array.isArray(coordinates[0])) {
      pixelCoordinates = fromLonLat(coordinates[0])
    } else {
      pixelCoordinates = fromLonLat(coordinates)
    }

    overlay.setPosition(pixelCoordinates)

    // 添加到地图
    if (map) {
      map.addOverlay(overlay)
    }

    // 使用 Vue 渲染组件内容
    const { createApp, h } = await import('vue')
    const { ElImage, ElIcon } = await import('element-plus')
    const { Picture } = await import('@element-plus/icons-vue')

    // 定义 slots 渲染函数
    const slots = {
      photos: ({ value, row }: { value: any; row: any }) => {
        return h('div', { class: 'photo-gallery' }, [
          value && value.length > 0
            ? h('div', { class: 'photo-list' },
              value.map((photo: string, index: number) =>
                h(ElImage, {
                  src: photo,
                  previewSrcList: value,
                  initialIndex: index,
                  fit: 'cover',
                  class: 'photo-item',
                  alt: `现场照片 ${index + 1}`,
                  style: { width: '80px', height: '80px' }
                }, {
                  error: () => h('div', { class: 'image-error' }, [
                    h(ElIcon, { class: 'el-icon--left' }, () => h(Picture)),
                    h('span', '图片加载失败')
                  ])
                })
              )
            )
            : h('div', { class: 'no-photos' }, [
              h(ElIcon, { class: 'el-icon--left' }, () => h(Picture)),
              h('span', '暂无照片')
            ])
        ])
      },
      status: ({ value, row }: { value: any; row: any }) => {
        // 状态标签的渲染函数
        return h('el-tag', {
          type: value === '正常' ? 'success' : 'danger',
          size: 'small'
        }, value)
      }
    }

    // 创建 Vue 应用
    const app = createApp(DynamicPopup, {
      rowData: officialInfo,
      config: config,
      themeColors: gasBlueTheme,
      slots: slots, // 传递 slots
      onClose: () => {
        removeDevicePopup(popupId)
      },
      onAction: (action: any, rowData: any) => {
        console.log('执行操作:', action.key, rowData)
        handlePopupAction(action.key, rowData)
      }
    })

    // 注册 Element Plus 组件
    app.use(ElImage)
    app.use(ElIcon)

    // 挂载到弹窗内容容器
    app.mount(popupContent)

    // 存储弹窗引用
    const popupInfo: PopupInfo = {
      overlay,
      element: popupElement,
      app
    }

    setDevicePopup(popupId, popupInfo)

  } catch (error) {
    console.error('创建动态弹窗失败:', error)
  }
}

// 处理弹窗操作
const handlePopupAction = (actionKey: string, rowData: any) => {
  switch (actionKey) {
    case 'viewDetail':
      // 查看详情逻辑
      console.log('查看详情:', rowData)
      break
    case 'edit':
      // 编辑逻辑
      console.log('编辑信息:', rowData)
      break
    case 'monitor':
      // 实时监控逻辑
      console.log('实时监控:', rowData)
      break
    case 'confirm':
      // 确认告警逻辑
      console.log('确认告警:', rowData)
      break
    // 其他操作...
  }
}

// 处理表格行点击
const handleTableRowClick = async (rowData: any) => {
  console.log('表格行点击:', rowData)

  // 如果行数据有坐标，聚焦到该位置
  if (rowData.data?.coordinates && map) {
    // 先移除所有现有的弹窗
    removeAllDevicePopups()

    // 聚焦到坐标位置
    focusOnCoordinates(rowData.data.coordinates)

    console.log('点击行数据', rowData.data.officialInfo)
    // 显示官网信息弹窗
    if (rowData.data.officialInfo) {
      // 给地图动画一点时间完成
      setTimeout(() => {
        showOfficialInfoPopup(rowData.data.officialInfo, rowData.data.coordinates, popupType.value)
      }, 500)
    }
  }
}

// 刷新表格数据
const refreshTableData = () => {
  tableLoading.value = true
  // 模拟数据刷新
  setTimeout(() => {
    tableLoading.value = false
    console.log('表格数据已刷新')
  }, 1000)
}

// 导出表格数据
const exportTableData = () => {
  console.log('导出表格数据')
  // 这里可以实现导出逻辑
}

// 监听面板显示状态变化，动态调整地图
watch([showLeftPanel, showBottomPanel], () => {
  setTimeout(() => {
    map?.updateSize()
  }, 150)
})

const router = useRouter()

// 地图信息数据
const scale = ref('300km')
const longitude = ref('96.99505373')
const latitude = ref('49.85332650')
const altitude = ref('0.00米')
const viewAngle = ref('-89.90')
const viewHeight = ref('7413725.84米')

// 图层控制
const selectedLayers = ref(['pipeline', 'equipment', 'warning'])
const showLayersPanel = ref(false)

// OpenLayers 地图实例
const mapContainer = ref<HTMLElement>()
let map: Map | null = null
let vectorLayer: VectorLayer<VectorSource> | null = null

// 初始化地图
const initMap = () => {
  if (!mapContainer.value) return

  // 高德地图瓦片服务
  const gaodeSource = new XYZ({
    url: 'https://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}',
    projection: 'EPSG:3857',
    crossOrigin: 'anonymous'
  })

  // 创建比例尺控件
  const scaleControl = new ScaleLine({
    units: 'metric',
    bar: true,
    steps: 4,
    text: true,
    minWidth: 100
  })

  // 创建地图
  map = new Map({
    target: mapContainer.value,
    layers: [
      new TileLayer({
        source: gaodeSource
      })
    ],
    view: new View({
      center: fromLonLat([116.3974, 39.9093]), // 北京中心点
      zoom: 10,
      minZoom: 3,
      maxZoom: 18
    }),
    controls: defaultControls().extend([scaleControl])
  })

  // 添加矢量图层
  const vectorSource = new VectorSource()
  vectorLayer = new VectorLayer({
    source: vectorSource,
    style: new Style({
      image: new Circle({
        radius: 6,
        fill: new Fill({ color: '#165DFF' }),
        stroke: new Stroke({ color: '#fff', width: 2 })
      }),
      stroke: new Stroke({
        color: '#FF7D00',
        width: 3
      })
    })
  })

  map.addLayer(vectorLayer)

  // 添加示例数据
  addSampleData()

  // 监听地图视图变化，更新坐标信息
  map.getView().on('change', updateMapInfo)

  // 监听地图移动，更新所有弹窗位置
  map.on('moveend', () => {
    // 当地图移动结束时，可以在这里更新弹窗位置
    console.log('地图移动结束，当前弹窗数量:', getDevicePopupIds().length)
  })

  // 确保地图正确渲染
  setTimeout(() => {
    map?.updateSize()
    updateMapInfo()
  }, 100)
}

// 更新地图信息
const updateMapInfo = () => {
  if (!map) return

  const view = map.getView()
  const center = view.getCenter()

  if (center) {
    const lonLat = toLonLat(center)
    longitude.value = lonLat[0].toFixed(8)
    latitude.value = lonLat[1].toFixed(8)
  }

  // 更新比例尺信息（这里简化处理，实际应根据zoom级别计算）
  const zoom = view.getZoom()
  if (zoom) {
    scale.value = `${Math.round(1000 / Math.pow(2, zoom - 3))}km`
  }
}

// 添加示例管网数据
const addSampleData = () => {
  if (!vectorLayer) return

  const source = vectorLayer.getSource()
  if (!source) return

  // 添加管线
  const pipeline = new Feature({
    geometry: new LineString([
      fromLonLat([116.3974, 39.9093]),
      fromLonLat([116.4074, 39.9193]),
      fromLonLat([116.4174, 39.9093])
    ]),
    name: '主干管线',
    type: 'pipeline'
  })

  pipeline.setStyle(new Style({
    stroke: new Stroke({
      color: '#165DFF',
      width: 4
    })
  }))

  // 添加设备点
  const equipmentPoints = [
    { coords: [116.3974, 39.9093], name: '调压站1', type: 'station' },
    { coords: [116.4074, 39.9193], name: '监测点1', type: 'monitor' },
    { coords: [116.4174, 39.9093], name: '阀门1', type: 'valve' }
  ]

  equipmentPoints.forEach(point => {
    const feature = new Feature({
      geometry: new Point(fromLonLat(point.coords)),
      name: point.name,
      type: point.type
    })

    feature.setStyle(new Style({
      image: new Circle({
        radius: 8,
        fill: new Fill({
          color: point.type === 'station' ? '#F53F3F' :
            point.type === 'monitor' ? '#00B42A' : '#FF7D00'
        }),
        stroke: new Stroke({ color: '#fff', width: 2 })
      })
    }))

    source.addFeature(feature)
  })

  source.addFeature(pipeline)
}

// 地图控制方法
const zoomIn = () => {
  if (map) {
    const view = map.getView()
    view.animate({ zoom: view.getZoom()! + 1, duration: 250 })
  }
}

const zoomOut = () => {
  if (map) {
    const view = map.getView()
    view.animate({ zoom: view.getZoom()! - 1, duration: 250 })
  }
}

const resetView = () => {
  if (map) {
    map.getView().animate({
      center: fromLonLat([116.3974, 39.9093]),
      zoom: 10,
      duration: 500
    })
  }
}

const toggleLayersPanel = () => {
  showLayersPanel.value = !showLayersPanel.value
}

// 处理点数据并添加到地图
const addPointDataToMap = (pointData: any[]) => {
  if (!map || !vectorLayer) return

  const source = vectorLayer.getSource()
  if (!source) return

  // 过滤掉没有几何数据的点
  const validPoints = pointData.filter(point => point.geom && Array.isArray(point.geom) && point.geom.length === 2)

  validPoints.forEach(point => {
    const feature = new Feature({
      geometry: new Point(fromLonLat(point.geom)),
      id: point.id,
      type: 'point',
      note: point.note,
      layer: point.layer,
      status: point.st,
      originalData: point // 保存原始数据
    })

    // 设置点样式
    feature.setStyle(createPointStyle(point))

    source.addFeature(feature)
  })

  console.log(`成功添加 ${validPoints.length} 个点要素`)
}

// 处理线数据并添加到地图
const addLineDataToMap = (lineData: any[]) => {
  if (!map || !vectorLayer) return

  const source = vectorLayer.getSource()
  if (!source) return

  // 过滤掉没有几何数据的线
  const validLines = lineData.filter(line =>
    line.geom &&
    Array.isArray(line.geom) &&
    line.geom.length >= 2 && // 至少两个点才能构成线
    line.geom.every((coord: any) => Array.isArray(coord) && coord.length === 2)
  )

  validLines.forEach(line => {
    // 将坐标转换为地图坐标
    const coordinates = line.geom.map((coord: number[]) => fromLonLat(coord))

    const feature = new Feature({
      geometry: new LineString(coordinates),
      id: line.id,
      type: 'line',
      note: line.note,
      layer: line.layer,
      status: line.st,
      width: line.w,
      originalData: line // 保存原始数据
    })

    // 设置线样式
    feature.setStyle(createLineStyle(line))

    source.addFeature(feature)
  })

  console.log(`成功添加 ${validLines.length} 个线要素`)
}

// 创建点样式
const createPointStyle = (pointData: any) => {
  // 根据点数据的不同属性设置不同样式
  let color = '#165DFF' // 默认蓝色
  let radius = 6

  // 根据状态设置颜色
  if (pointData.st === 1) {
    color = '#00B42A' // 正常状态 - 绿色
  } else if (pointData.st === 0) {
    color = '#F53F3F' // 异常状态 - 红色
  }

  // 根据图层设置不同样式
  switch (pointData.layer) {
    case 1:
      radius = 8
      break
    case 2:
      radius = 6
      color = '#FF7D00' // 橙色
      break
    default:
      radius = 6
  }

  return new Style({
    image: new Circle({
      radius: radius,
      fill: new Fill({ color: color }),
      stroke: new Stroke({
        color: '#fff',
        width: 2
      })
    }),
    text: new OlText({
      text: pointData.note || `点${pointData.id}`,
      offsetY: -15,
      font: '12px Microsoft YaHei',
      fill: new Fill({ color: '#333' }),
      stroke: new Stroke({ color: '#fff', width: 2 })
    })
  })
}

// 创建线样式
const createLineStyle = (lineData: any) => {
  // 根据线数据的不同属性设置不同样式
  let color = '#1E6FBA' // 默认蓝色
  let width = 3

  // 根据状态设置颜色
  if (lineData.st === 1) {
    color = '#00B42A' // 正常状态 - 绿色
  } else if (lineData.st === 0) {
    color = '#F53F3F' // 异常状态 - 红色
  }

  // 根据宽度属性设置线宽
  if (lineData.w) {
    width = Math.max(2, Math.min(8, lineData.w * 2)) // 根据数据中的宽度值调整
  }

  // 根据图层设置不同样式
  switch (lineData.layer) {
    case 1:
      color = '#1E6FBA' // 主干管网 - 蓝色
      width = 4
      break
    case 2:
      color = '#FF7D00' // 支线管网 - 橙色
      width = 3
      break
    case 3:
      color = '#00B42A' // 庭院管网 - 绿色
      width = 2
      break
  }

  return new Style({
    stroke: new Stroke({
      color: color,
      width: width,
      lineCap: 'round',
      lineJoin: 'round'
    })
  })
}

// 清空现有矢量数据
const clearVectorData = () => {
  if (!vectorLayer) return

  const source = vectorLayer.getSource()
  if (source) {
    source.clear()
    console.log('已清空矢量数据')
  }
}

// 更新地图显示范围以适应所有要素
const fitMapToFeatures = () => {
  if (!map || !vectorLayer) return

  const source = vectorLayer.getSource()
  if (!source) return

  const features = source.getFeatures()
  if (features.length === 0) return

  // 获取所有要素的边界范围
  const extent = source.getExtent()
  if (extent && extent[0] !== Infinity) {
    map.getView().fit(extent, {
      padding: [50, 50, 50, 50],
      duration: 500
    })
    console.log('地图已调整到适合所有要素的显示范围')
  }
}

// 添加要素点击事件
const setupFeatureInteraction = () => {
  console.log(map)
  if (!map) return

  map.on('click', (event) => {
    if (!vectorLayer) return

    const feature = map!.forEachFeatureAtPixel(event.pixel, (feature) => feature)

    if (feature) {
      const featureType = feature.get('type')
      const originalData = feature.get('originalData')

      console.log('点击要素:', featureType, originalData)

      // 根据要素类型显示不同信息
      if (featureType === 'point') {
        showPointDetail(originalData, feature.getGeometry() as Point)
      } else if (featureType === 'line') {
        showLineDetail(originalData, feature.getGeometry() as LineString)
      }
    }
  })

  // 修改鼠标样式
  map.on('pointermove', (event) => {
    if (!vectorLayer) return

    const pixel = map!.getEventPixel(event.originalEvent)
    const hit = map!.hasFeatureAtPixel(pixel)

    map!.getTargetElement().style.cursor = hit ? 'pointer' : ''
  })
}

// 显示点详情
const showPointDetail = async (pointData: any, geometry: Point) => {
  const coordinates = toLonLat(geometry.getCoordinates())
  const pointId = `point_${pointData.id}`

  // 创建点数据详情
  const detailData = {
    id: pointData.id,
    name: pointData.note || `点${pointData.id}`,
    type: '监测点',
    status: pointData.st === 1 ? '正常' : '异常',
    location: `${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}`,
    layer: getLayerName(pointData.layer),
    updateTime: new Date().toLocaleString('zh-CN'),
    ...pointData
  }

  // 创建图表数据（示例）
  const chartData = {
    accumulated: Math.floor(Math.random() * 1000).toString(),
    flowRate: (Math.random() * 100).toFixed(2),
    temperature: Math.floor(Math.random() * 50).toString(),
    pressure: (Math.random() * 10).toFixed(2),
    temperatureData: Array(6).fill(0).map(() => Math.floor(Math.random() * 50)),
    pressureData: Array(6).fill(0).map(() => (Math.random() * 10).toFixed(2))
  }

  // 创建设备弹窗
  await createDevicePopup(pointId, detailData, chartData, coordinates)
}

// 显示线详情
const showLineDetail = async (lineData: any, geometry: LineString) => {
  const coordinates = geometry.getCoordinates().map(coord => toLonLat(coord))
  const lineId = `line_${lineData.id}`

  // 使用官方信息弹窗显示线数据
  const officialInfo = {
    name: lineData.note || `管线${lineData.id}`,
    material: '未知材质', // 根据实际数据结构调整
    years: '未知年限',
    pressureLevel: '未知压力等级',
    anticorrosion: '未知防腐',
    diameter: `DN${lineData.w * 100 || '未知'}`,
    other: lineData.att ? JSON.stringify(lineData.att) : '无',
    length: `${(lineData.geom.length * 100).toFixed(2)}米` // 估算长度
  }

  await showOfficialInfoPopup(officialInfo, coordinates, 'pipeline')
}

// 获取图层名称
const getLayerName = (layerId: number): string => {
  const layerMap: Record<number, string> = {
    1: '主干管网',
    2: '支线管网',
    3: '庭院管网',
    4: '设备层'
  }
  return layerMap[layerId] || `图层${layerId}`
}


// 添加窗口大小变化处理函数
// const handleWindowResize = () => {
//   // 触发样式重新计算
//   leftTreePanelStyle.value = getLeftPanelStyle()
//   leftTerminalPanelStyle.value = getLeftPanelStyle()
//   gasStatusPanelStyle.value = getLeftPanelStyle()

//   // 更新地图大小
//   setTimeout(() => {
//     map?.updateSize()
//   }, 100)
// }

const pntData = ref<any[]>([])
const linData = ref<any[]>([])
// 生命周期
onMounted(() => {
  initMap()

  // 获取点线数据
  const minLng = 109.20
  const minLat = 36.602
  const maxLng = 109.49
  const maxLat = 36.603

  Promise.all([
    apiModules.zzrq.getPntByArea({ minLng, minLat, maxLng, maxLat }),
    apiModules.zzrq.getLinByArea({ minLng, minLat, maxLng, maxLat })
  ]).then((res: any) => {
    pntData.value = res[0]
    linData.value = res[1]
    console.log('点数据:', pntData.value)
    console.log('线数据:', linData.value)

    // 清空示例数据，添加实际数据
    clearVectorData()
    addPointDataToMap(pntData.value)
    addLineDataToMap(linData.value)

    // 调整地图显示范围
    setTimeout(() => {
      fitMapToFeatures()
    }, 100)
  }).catch(error => {
    console.error('获取点线数据失败:', error)
  })

  // 设置要素交互
  setupFeatureInteraction()

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  removeAllDevicePopups()
  if (map) {
    map.setTarget(undefined)
  }
  window.removeEventListener('resize', handleResize)
})

// 窗口大小变化处理
const handleResize = () => {
  if (map) {
    setTimeout(() => {
      map?.updateSize()
    }, 150)
  }
}

// 图例
// 处理图例选择变化
const handleLegendSelectionChange = (selectedItems: any[]) => {
  console.log('图例选择变化:', selectedItems)
  // 这里可以根据选择的设备类型更新地图显示
  updateMapWithLegendSelection(selectedItems)
}

// 根据图例选择更新地图显示
const updateMapWithLegendSelection = (selectedItems: any[]) => {
  if (!map || !vectorLayer) return

  console.log('根据图例选择更新地图显示', selectedItems)

  // 获取选中的设备类型
  const selectedTypes = selectedItems.map(item => item.name)

  // 这里可以根据选中的设备类型来过滤或高亮地图上的要素
  // 示例：更新图层样式
  const source = vectorLayer.getSource()
  if (source) {
    vectorLayer.setStyle((feature) => {
      const featureType = feature.get('type')
      const isSelected = selectedTypes.some(type =>
        getFeatureTypeMapping(type) === featureType
      )

      // 根据选择状态返回不同的样式
      return createLegendStyle(featureType, isSelected)
    })
  }
}

// 设备类型映射（根据实际数据结构调整）
const getFeatureTypeMapping = (legendType: string): string => {
  const mapping: Record<string, string> = {
    '调压箱': 'station',
    '调压柜': 'cabinet',
    '撬装柜': 'skid',
    '阀门': 'valve',
    '流量计': 'flowmeter',
    '压力计': 'pressure',
    '场站': 'field'
  }
  return mapping[legendType] || legendType
}

// 创建图例相关的样式
const createLegendStyle = (featureType: string, isSelected: boolean) => {
  const baseStyle: Record<string, { color: string; radius: number }> = {
    station: { color: '#1E6FBA', radius: 8 },
    cabinet: { color: '#FF6B6B', radius: 6 },
    skid: { color: '#4ECDC4', radius: 6 },
    valve: { color: '#45B7D1', radius: 5 },
    flowmeter: { color: '#FFA07A', radius: 5 },
    pressure: { color: '#98D8C8', radius: 5 },
    field: { color: '#9B59B6', radius: 10 }
  }

  const styleConfig = baseStyle[featureType] || { color: '#165DFF', radius: 6 }

  if (!isSelected) {
    // 未选中的设备显示为灰色
    return new Style({
      image: new Circle({
        radius: styleConfig.radius,
        fill: new Fill({ color: '#CCCCCC' }),
        stroke: new Stroke({ color: '#999999', width: 1 })
      })
    })
  }

  return new Style({
    image: new Circle({
      radius: styleConfig.radius,
      fill: new Fill({ color: styleConfig.color }),
      stroke: new Stroke({ color: '#fff', width: 2 })
    })
  })
}

// 表格搜索处理
const handleTableSearch = (keyword: string) => {
  console.log('表格搜索:', keyword)
  // 实现搜索逻辑
}

// 表格查看详情
const handleTableView = (row: any) => {
  console.log('查看详情:', row)
  // 实现查看详情逻辑
}

// 表格编辑
const handleTableEdit = (row: any) => {
  console.log('编辑数据:', row)
  // 实现编辑逻辑
}
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
</script>

<style scoped>
.pipe-network-view {
  height: calc(100vh - 64px);
  /* 减去Header高度 */
  width: 100vw;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  overflow: hidden;
}

.map-content {
  flex: 1;
  display: flex;
  height: 100%;
  width: 100%;
  position: relative;
}

.map-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #e5e7eb;
}

.ol-map {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* 调整信息显示组件位置，避免与控制组件重叠 */
.info-display-adjusted {
  right: 80px;
}

/* 图层控制面板 */
.layer-panel {
  position: absolute;
  right: 70px;
  /* 放在控制按钮左侧 */
  top: 20px;
  z-index: 1000;
  width: 0;
  height: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transition: all 0.3s ease;
  opacity: 0;
}

.layer-panel-expanded {
  width: 220px;
  opacity: 1;
  padding: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-header span {
  font-weight: 600;
  font-size: 14px;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.el-checkbox) {
  margin-right: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .layer-panel {
    right: 60px;
    top: 10px;
  }

  .layer-panel-expanded {
    width: 180px;
  }
}

/* 原有样式保持不变，优化悬浮面板样式 */

.pipe-network-view {
  height: calc(100vh - 64px);
  width: 100vw;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  overflow: hidden;
  position: relative;
}

.map-content {
  flex: 1;
  display: flex;
  height: 100%;
  width: 100%;
  position: relative;
}

.map-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #e5e7eb;
}

/* 悬浮面板通用样式 */
.floating-panel {
  position: absolute;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(30, 111, 186, 0.2);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  border: 1px solid v-bind('gasBlueTheme.borderBlue');
  backdrop-filter: blur(8px);
  overflow: hidden;
  /* 确保内容不会溢出 */
}

.floating-panel.panel-hidden {
  opacity: 0;
  visibility: hidden;
  transform: scale(0.95);
}

/* 左侧树形面板 */
/* .left-tree-panel {
  left: 20px;
  top: 20px;
  width: v-bind(leftPanelWidth + 'px');
  min-width: 280px;
  max-width: 500px;
  background: linear-gradient(135deg, v-bind('gasBlueTheme.lightBlue') 0%, white 100%);
  border: 1px solid v-bind('gasBlueTheme.borderBlue');
} */

/* 底部表格面板 */
.bottom-table-panel {
  left: 20px;
  right: 20px;
  bottom: 20px;
  height: v-bind(bottomPanelHeight + 'px');
  min-height: 200px;
  max-height: 400px;
  background: linear-gradient(135deg, v-bind('gasBlueTheme.lightBlue') 0%, white 100%);
  border: 1px solid v-bind('gasBlueTheme.borderBlue');
  /* 宽度保持不变 */
}

/* 面板头部样式 - 燃气行业蓝色主题 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid v-bind('gasBlueTheme.borderBlue');
  background: linear-gradient(90deg, v-bind('gasBlueTheme.primary') 0%, v-bind('gasBlueTheme.darkBlue') 100%);
  border-radius: 8px 8px 0 0;
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: white;
}

.panel-title .el-icon {
  color: white;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.close-btn {
  padding: 4px;
  color: rgba(255, 255, 255, 0.8);
}

.close-btn:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

/* 面板操作按钮样式 */
.panel-actions .el-button {
  color: rgba(255, 255, 255, 0.8);
}

.panel-actions .el-button:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

/* 面板内容区域 */
.panel-content {
  flex: 1;
  overflow: hidden;
  border-radius: 0 0 8px 8px;
  background: transparent;
}

/* 调整大小手柄 */
.panel-resize-handle {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background: transparent;
  transition: background-color 0.2s ease;
  z-index: 1001;
}

.panel-resize-handle:hover {
  background: v-bind('gasBlueTheme.primary');
}

.panel-resize-handle.vertical {
  right: 0;
  left: 0;
  top: -2px;
  bottom: auto;
  height: 4px;
  width: auto;
  cursor: row-resize;
}

.panel-resize-handle.vertical:hover {
  background: v-bind('gasBlueTheme.primary');
}

/* 地图信息显示组件位置调整 */
.info-display-adjusted {
  right: 80px;
  bottom: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .left-tree-panel {
    left: 10px;
    right: 10px;
    top: 10px;
    width: auto;
    height: 40vh;
    min-width: unset;
    max-width: unset;
  }

  .bottom-table-panel {
    left: 10px;
    right: 10px;
    bottom: 10px;
    height: 40vh;
  }

  .panel-resize-handle.vertical {
    display: none;
    /* 移动端禁用垂直调整 */
  }
}

/* 确保地图控制组件在悬浮面板之上 */
:deep(.map-controls) {
  z-index: 1001;
}

/* 确保动态面板容器在悬浮面板之上 */
:deep(.dynamic-panel-container) {
  z-index: 1001;
}

/* 优化面板重叠时的视觉效果 */
.left-tree-panel.with-bottom-panel {
  box-shadow: 0 4px 20px rgba(30, 111, 186, 0.3);
}

/* 为TreeStructure和DataTable组件添加燃气主题 */
:deep(.tree-structure) {
  --el-color-primary: v-bind('gasBlueTheme.primary');
}

:deep(.data-table-container) {
  --el-color-primary: v-bind('gasBlueTheme.primary');
}

/* 修改主组件中的弹窗样式 */
.ol-popup {
  position: absolute;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 2px solid #1E6FBA;
  /* 直接使用颜色值 */
  min-width: 400px;
  max-width: 800px;
  z-index: 1002;
  transform: translate(-50%, -100%);
  cursor: default;
}

.popup-content {
  border-radius: 12px;
  overflow: hidden;
}

.popup-arrow {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #1E6FBA;
  /* 直接使用颜色值 */
}

/* 确保弹窗在面板之上 */
.ol-popup {
  z-index: 1002;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ol-popup {
    min-width: 300px;
    max-width: calc(100vw - 40px);
    left: 20px !important;
    right: 20px !important;
    transform: translate(0, -100%) !important;
  }

  .popup-arrow {
    left: 50%;
  }
}

/* 新增气源压力面板样式 */
/* .left-gas-status-panel {
  left: 20px;
  top: 20px;
  width: v-bind(gasStatusPanelWidth + 'px');
  min-width: 280px;
  max-width: 500px;
  background: linear-gradient(135deg, v-bind('gasBlueTheme.lightBlue') 0%, white 100%);
  border: 1px solid v-bind('gasBlueTheme.borderBlue');
} */

/* 响应式设计 */
/* @media (max-width: 768px) {
  .left-gas-status-panel {
    left: 10px;
    right: 10px;
    top: 10px;
    width: auto;
    height: 40vh;
    min-width: unset;
    max-width: unset;
  }
} */

/* 确保管网类型面板的z-index正确 */
:deep(.pipe-type-panel) {
  z-index: 1000;
}

/* 如果有多个面板，确保它们不会重叠 */
@media (min-width: 1200px) {
  .left-tree-panel {
    left: 20px;
  }
}

/* 在现有样式中添加图例容器的样式 */
/* 在现有样式中确保图例面板的z-index正确 */
.legend-panel {
  z-index: 1000;
}

/* 如果有多个左侧面板，确保它们不会重叠 */
@media (min-width: 1200px) {
  .left-tree-panel {
    left: 340px;
    /* 图例面板宽度 + 间距 */
  }

  .legend-panel {
    left: 20px;
  }
}

/* 在主页组件的 style 中添加 */
.photo-gallery {
  width: 100%;
}

.photo-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.photo-item {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.photo-item:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
}

.image-error .el-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.no-photos {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #909399;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
}

.no-photos .el-icon {
  margin-right: 8px;
  font-size: 16px;
}

/* 修改现有的右侧面板样式类名 */
.right-panel {
  right: 20px;
  top: 20px;
  width: v-bind(rightPanelWidth + 'px');
  min-width: 300px;
  max-width: 500px;
  background: linear-gradient(135deg, v-bind('gasBlueTheme.lightBlue') 0%, white 100%);
  border: 1px solid v-bind('gasBlueTheme.borderBlue');
}

.right-panel.panel-hidden {
  opacity: 0;
  visibility: hidden;
  transform: scale(0.95);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .right-panel {
    right: 10px;
    width: calc(50vw - 60px);
    min-width: 280px;
  }
}

@media (max-width: 768px) {
  .right-panel {
    display: none;
    /* 移动端隐藏右侧面板 */
  }
}

/* 左侧面板通用样式 */
.left-tree-panel,
.left-terminal-panel,
.left-gas-status-panel {
  left: 20px;
  top: 20px;
  min-width: 280px;
  max-width: 450px;
  background: linear-gradient(135deg, v-bind('gasBlueTheme.lightBlue') 0%, white 100%);
  border: 1px solid v-bind('gasBlueTheme.borderBlue');
}

/* 面板内容区域确保使用flex布局 */
.panel-content {
  flex: 1;
  overflow: auto;
  /* 允许内容滚动 */
  border-radius: 0 0 8px 8px;
  background: transparent;
}

/* 当有底部面板时，左侧面板的特殊样式 */
.floating-panel.with-bottom-panel {
  box-shadow: 0 4px 20px rgba(30, 111, 186, 0.3);
}

/* 响应式设计 - 移动端 */
@media (max-width: 768px) {

  .left-tree-panel,
  .left-terminal-panel,
  .left-gas-status-panel {
    left: 10px;
    right: 10px;
    top: 10px;
    width: auto !important;
    max-width: unset;
  }

  /* 移动端当底部面板显示时，左侧面板高度减少 */
  .floating-panel.with-bottom-panel {
    height: calc(50vh - 20px) !important;
    max-height: calc(50vh - 20px) !important;
  }
}

/* 确保面板内容不会导致面板膨胀 */
:deep(.terminal-equipment-panel),
:deep(.tree-structure),
:deep(.gas-status-panel) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 优化滚动条样式 */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 确保底部面板的图表区域正确显示 */
.bottom-table-panel .panel-content {
  overflow: auto;
}

.terminal-stats-panel {
  height: 100%;
  padding: 16px;
}

/* 调整面板操作按钮间距 */
.panel-actions {
  gap: 8px;
}
</style>
