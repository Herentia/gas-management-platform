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

        <!-- 新增：气源压力运行状态面板 -->
        <div class="floating-panel left-gas-status-panel"
          :class="{ 'panel-hidden': !showGasStatusPanel, 'with-bottom-panel': showBottomPanel }"
          :style="gasStatusPanelStyle">
          <div class="panel-header">
            <div class="panel-title">
              <el-icon>
                <DataLine />
              </el-icon>
              <span>气源压力运行</span>
            </div>
            <div class="panel-actions">
              <el-button link :icon="Close" @click="showGasStatusPanel = false" class="close-btn" />
            </div>
          </div>
          <div class="panel-content">
            <GasStatusPanel :data="gasStatusDevices" @device-click="handleGasDeviceClick" @search="handleGasSearch"
              @status-change="handleGasStatusChange" @export="exportGasStatusData" v-if="showGasStatusPanel" />
          </div>
          <div class="panel-resize-handle" @mousedown="startResize('gasStatus')"></div>
        </div>

        <!-- 左侧树形结构悬浮面板 -->
        <div class="floating-panel left-tree-panel"
          :class="{ 'panel-hidden': !showLeftPanel, 'with-bottom-panel': showBottomPanel }" :style="leftPanelStyle">
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

        <!-- 底部表格悬浮面板 -->
        <div class="floating-panel bottom-table-panel" :class="{ 'panel-hidden': !showBottomPanel }">
          <div class="panel-header">
            <div class="panel-title">
              <el-icon>
                <Grid />
              </el-icon>
              <span>{{ bottomTableTitle }}</span>
            </div>
            <div class="panel-actions">
              <el-tooltip content="刷新数据">
                <el-button link :icon="Refresh" @click="refreshTableData" />
              </el-tooltip>
              <el-tooltip content="导出数据">
                <el-button link :icon="Download" @click="exportTableData" />
              </el-tooltip>
              <el-button link :icon="Close" @click="showBottomPanel = false" class="close-btn" />
            </div>
          </div>
          <div class="panel-content">
            <!-- 动态表格组件 -->
            <DataTable :data="tableData" :loading="tableLoading" :columns="tableColumns" :show-actions="true"
              :show-pagination="true" :show-edit="false" :show-delete="false" @row-click="handleTableRowClick"
              @view="handleTableView" @refresh="refreshTableData" @export="exportTableData" @search="handleTableSearch">
              <!-- 自定义状态列 -->
              <template #status="{ row }">
                <el-tag :type="row.status === '正常' ? 'success' : 'danger'" size="small">
                  {{ row.status }}
                </el-tag>
              </template>

              <!-- 自定义类型列 -->
              <template #type="{ row }">
                <el-tag :type="getTagType(row.type)" size="small">
                  {{ row.type }}
                </el-tag>
              </template>

              <!-- 自定义操作列 -->
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
        <LegendPanel :visible="showLegendPanel" :theme-colors="gasBlueTheme" @close="showLegendPanel = false"
          @selection-change="handleLegendSelectionChange" />
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
import { Style, Stroke, Circle, Fill } from 'ol/style'

// 原有导入保持不变
import TreeStructure from '@/components/map/TreeStructure.vue'
import DataTable from '@/components/map/DataTable.vue'
import { Folder, Grid, Refresh, Download, Close } from '@element-plus/icons-vue'
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
const tableColumns = ref([
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

const warningColumns = ref([
  { prop: 'id', label: '告警ID', width: 100 },
  { prop: 'deviceName', label: '设备名称', minWidth: 120 },
  { prop: 'warningType', label: '告警类型', width: 100 },
  { prop: 'level', label: '告警级别', width: 100, slot: 'level' },
  { prop: 'description', label: '告警描述', minWidth: 200 },
  { prop: 'startTime', label: '开始时间', width: 160 },
  { prop: 'status', label: '处理状态', width: 100, slot: 'status' }
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
const gasStatusDevices = null;
// const gasStatusDevices = ref([
//   {
//     id: 'FC1',
//     name: 'FC1',
//     status: 'normal' as const,
//     pressure: '0.85',
//     temperature: '25.3',
//     coordinates: [116.3974, 39.9093],
//     data: {
//       type: 'pressure_station',
//       model: 'PCS-1000',
//       installDate: '2023-01-15'
//     }
//   },
//   {
//     id: 'FC2',
//     name: 'FC2',
//     status: 'normal' as const,
//     pressure: '0.85',
//     temperature: '25.3',
//     coordinates: [116.3974, 38.9093],
//     data: {
//       type: 'pressure_station',
//       model: 'PCS-1000',
//       installDate: '2023-01-15'
//     }
//   },
//   {
//     id: 'FC3',
//     name: 'FC3',
//     status: 'normal' as const,
//     pressure: '0.85',
//     temperature: '25.3',
//     coordinates: [116.3974, 39.9093],
//     data: {
//       type: 'pressure_station',
//       model: 'PCS-1000',
//       installDate: '2023-01-15'
//     }
//   },
//   {
//     id: 'FC4',
//     name: 'FC4',
//     status: 'normal' as const,
//     pressure: '0.85',
//     temperature: '25.3',
//     coordinates: [116.3974, 39.9093],
//     data: {
//       type: 'pressure_station',
//       model: 'PCS-1000',
//       installDate: '2023-01-15'
//     }
//   },
//   // ... 其他设备数据
// ])

// 面板样式
const gasStatusPanelStyle = computed(() => {
  const style: any = {
    width: `${gasStatusPanelWidth.value}px`
  }

  if (showBottomPanel.value && showGasStatusPanel.value) {
    const bottomPanelVisibleHeight = bottomPanelHeight.value + 40
    style.height = `calc(100% - ${bottomPanelVisibleHeight}px)`
  } else {
    style.height = 'calc(100% - 40px)'
  }

  return style
})

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
  const dataToExport = gasStatusDevices.value.map(device => ({
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

  // 当底部面板显示时，调整左侧面板高度避免重叠
  if (showBottomPanel.value && showLeftPanel.value) {
    const bottomPanelVisibleHeight = bottomPanelHeight.value + 40 // 底部面板高度 + 上下边距
    style.height = `calc(100% - ${bottomPanelVisibleHeight}px)`
  } else {
    style.height = 'calc(100% - 40px)' // 默认高度（上下各20px边距）
  }

  return style
})

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

const tableData = ref<any>([])
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

// 管网管理菜单处理
const handlePipeNetworkMenu = (menuKey: string) => {
  activeMenu.value = menuKey
  switch (menuKey) {
    case '/pipe-network/gas-source':
      showGasStatusPanel.value = !showGasStatusPanel.value
      break
    case '/pipe-network/end-point':
      showGasStatusPanel.value = !showGasStatusPanel.value
      break
    case '/pipe-network/distribution':
      bottomTableTitle.value = '管网列表'
      showPipeTypePanel.value = !showPipeTypePanel.value
      showBottomPanel.value = !showBottomPanel.value
      tableData.value = gasData.value
      break
    case '/pipe-network/equipment':
      bottomTableTitle.value = '设备设施列表'
      showLegendPanel.value = true
      showBottomPanel.value = true
      tableColumns.value = deviceColumns.value
      tableData.value = deviceTableData.value
      break
  }

  setTimeout(() => {
    map?.updateSize()
  }, 100)
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
      break
    case '/inspection/routes':
      // 显示巡检路线面板
      break
    case '/inspection/reports':
      // 显示巡检报告面板
      break
  }
}

// 工程管理菜单处理
const handleEngineeringMenu = (menuKey: string) => {
  console.log('工程管理菜单点击:', menuKey)
  // 这里添加工程管理相关的面板控制逻辑
  switch (menuKey) {
    case '/engineering/projects':
      // 显示工程项目面板
      break
    case '/engineering/emergency':
      // 显示应急抢险面板
      break
    case '/engineering/progress':
      // 显示工程进度面板
      break
  }
}

// 客服管理菜单处理
const handleCustomerServiceMenu = (menuKey: string) => {
  console.log('客服管理菜单点击:', menuKey)
  // 这里添加客服管理相关的面板控制逻辑
  switch (menuKey) {
    case '/customer/requests':
      // 显示服务请求面板
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

// 定义不同数据类型的弹窗配置
const popupConfigs = {
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

  // 告警信息弹窗配置
  warning: {
    title: '告警信息',
    titleIcon: 'Warning',
    subtitle: '需要及时处理',
    displayType: 'table',
    minWidth: '380px',
    fields: [
      { key: 'deviceName', label: '设备名称', highlight: true },
      { key: 'warningType', label: '告警类型' },
      { key: 'level', label: '告警级别', slot: 'warningLevel' },
      { key: 'description', label: '告警描述' },
      { key: 'startTime', label: '开始时间' },
      { key: 'duration', label: '持续时间' },
      { key: 'suggestion', label: '处理建议' }
    ],
    actions: [
      { key: 'confirm', label: '确认告警', type: 'warning' },
      { key: 'handle', label: '立即处理', type: 'danger' },
      { key: 'ignore', label: '忽略', type: 'info' }
    ]
  }
}

// 在显示弹窗时根据数据类型选择配置
const showOfficialInfoPopup = async (officialInfo: any, coordinates: any, dataType: string = 'pipeline') => {
  const popupId = `dynamic_popup_${Date.now()}`

  try {
    // 根据数据类型获取配置
    const config = popupConfigs[dataType] || popupConfigs.pipeline

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
      max-height: 500px;
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
    const { createApp } = await import('vue')

    // 创建 Vue 应用
    const app = createApp(DynamicPopup, {
      rowData: officialInfo,
      config: config,
      themeColors: gasBlueTheme,
      onClose: () => {
        removeDevicePopup(popupId)
      },
      onAction: (action, rowData) => {
        console.log('执行操作:', action.key, rowData)
        // 处理不同的操作
        handlePopupAction(action.key, rowData)
      }
    })

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
        showOfficialInfoPopup(rowData.data.officialInfo, rowData.data.coordinates)
      }, 500)
    }
  }
}

// // 显示管网信息弹窗
// const showOfficialInfoPopup = async (officialInfo: any, coordinates: any) => {
//   const popupId = `official_info_${Date.now()}`

//   try {
//     console.log('开始创建管网信息弹窗，坐标:', coordinates)

//     // 创建弹窗容器
//     const popupElement = document.createElement('div')
//     popupElement.className = 'ol-popup official-info-popup-container'
//     popupElement.style.cssText = `
//       position: absolute;
//       background: white;
//       border-radius: 8px;
//       box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
//       border: 1px solid ${gasBlueTheme.primary};
//       width: 320px;
//       max-width: 450px;
//       min-width: 280px;
//       height: 300px;
//       z-index: 1003;
//       transform: translate(-50%, -100%);
//       cursor: default;
//       font-size: 12px;
//       overflow: hidden;
//     `

//     // 创建弹窗内容容器
//     const popupContent = document.createElement('div')
//     popupContent.className = 'popup-content'
//     popupContent.style.cssText = `
//       max-height: 500px;
//       overflow: hidden;
//     `

//     // 组装弹窗
//     popupElement.appendChild(popupContent)

//     // 创建 Overlay
//     const overlay = new Overlay({
//       element: popupElement,
//       positioning: 'bottom-center',
//       stopEvent: true,
//       offset: [0, -10],
//     })

//     // 设置位置 - 修复坐标处理
//     let pixelCoordinates
//     if (Array.isArray(coordinates) && Array.isArray(coordinates[0])) {
//       // 如果是线状要素（管线），取第一个点作为弹窗位置
//       console.log('线状要素，使用第一个点坐标:', coordinates[0])
//       pixelCoordinates = fromLonLat(coordinates[0])
//     } else {
//       // 如果是点状要素
//       console.log('点状要素，使用坐标:', coordinates)
//       pixelCoordinates = fromLonLat(coordinates)
//     }

//     console.log('弹窗位置像素坐标:', pixelCoordinates)
//     overlay.setPosition(pixelCoordinates)

//     // 添加到地图
//     if (map) {
//       map.addOverlay(overlay)
//       console.log('弹窗已添加到地图')
//     }

//     // 使用 Vue 渲染组件内容
//     const { createApp } = await import('vue')

//     console.log('创建官网信息弹窗 Vue 应用', officialInfo)

//     // 创建 Vue 应用
//     const app = createApp(OfficialInfoPopup, {
//       infoData: officialInfo,
//       themeColors: gasBlueTheme,
//       onClose: () => {
//         console.log('关闭管网信息弹窗')
//         removeDevicePopup(popupId)
//       },
//       onViewDetail: (data) => {
//         console.log('查看详情:', data)
//         // 这里可以跳转到详情页面或显示更详细的信息
//       }
//     })

//     // 挂载到弹窗内容容器
//     app.mount(popupContent)

//     // 存储弹窗引用
//     const popupInfo: PopupInfo = {
//       overlay,
//       element: popupElement,
//       app
//     }

//     setDevicePopup(popupId, popupInfo)

//     console.log(`管网信息弹窗 ${popupId} 创建成功`, popupElement)

//     // 确保地图更新
//     setTimeout(() => {
//       map?.updateSize()
//     }, 100)

//   } catch (error) {
//     console.error('创建官网信息弹窗失败:', error)
//   }
// }

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

// 面板拖拽调整大小
const startResize = (direction: string) => {
  isResizing.value = true
  resizeDirection.value = direction

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.value) return

    if (direction === 'left') {
      leftPanelWidth.value = Math.max(280, Math.min(500, e.clientX))
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

// 生命周期
onMounted(() => {
  initMap()
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
  const baseStyle = {
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
}

.floating-panel.panel-hidden {
  opacity: 0;
  visibility: hidden;
  transform: scale(0.95);
}

/* 左侧树形面板 */
.left-tree-panel {
  left: 20px;
  top: 20px;
  width: v-bind(leftPanelWidth + 'px');
  min-width: 280px;
  max-width: 500px;
  background: linear-gradient(135deg, v-bind('gasBlueTheme.lightBlue') 0%, white 100%);
  border: 1px solid v-bind('gasBlueTheme.borderBlue');
  /* 高度通过动态样式控制 */
}

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
.left-gas-status-panel {
  left: 20px;
  top: 20px;
  width: v-bind(gasStatusPanelWidth + 'px');
  min-width: 280px;
  max-width: 500px;
  background: linear-gradient(135deg, v-bind('gasBlueTheme.lightBlue') 0%, white 100%);
  border: 1px solid v-bind('gasBlueTheme.borderBlue');
}

/* 响应式设计 */
@media (max-width: 768px) {
  .left-gas-status-panel {
    left: 10px;
    right: 10px;
    top: 10px;
    width: auto;
    height: 40vh;
    min-width: unset;
    max-width: unset;
  }
}

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
</style>
