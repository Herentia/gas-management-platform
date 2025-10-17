<template>
  <Header @menu-click="handleMenuClick" />
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
              <span>数据列表</span>
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
            <DataTable :data="tableData" :loading="tableLoading" @row-click="handleTableRowClick"
              v-if="showBottomPanel" />
          </div>
          <div class="panel-resize-handle vertical" @mousedown="startResize('bottom')"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from '@/components/layout/HeaderWithMenu.vue'
import MapInfoDisplay from '@/components/map/MapInfoDisplay.vue'
import MapControls from '@/components/map/MapControls.vue'
import DynamicPanelContainer from './GasPipeControl/DynamicPanelContainer.vue'
import { useRouter } from 'vue-router'
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

// 表格数据
const tableData = ref([
  {
    id: '1',
    name: '北线主干管-001',
    type: '管线',
    status: '正常',
    location: '116.3974, 39.9093',
    updateTime: '2024-01-20 10:30:00',
    data: { coordinates: [[116.3974, 39.9093], [116.4074, 39.9193]] }
  },
  {
    id: '2',
    name: '调压站-A01',
    type: '设备',
    status: '正常',
    location: '116.4074, 39.9193',
    updateTime: '2024-01-20 09:15:00',
    data: { coordinates: [116.4074, 39.9193] }
  },
  {
    id: '3',
    name: '压力监测点-P001',
    type: '监测点',
    status: '警告',
    location: '116.4174, 39.9093',
    updateTime: '2024-01-20 11:20:00',
    data: { coordinates: [116.4174, 39.9093] }
  },
  {
    id: '4',
    name: '阀门-V001',
    type: '阀门',
    status: '正常',
    location: '116.4024, 39.9143',
    updateTime: '2024-01-20 08:45:00',
    data: { coordinates: [116.4024, 39.9143] }
  }
])

const tableLoading = ref(false)

// 处理菜单点击
const handleMenuClick = (menuKey: string) => {
  console.log('菜单点击:', menuKey)
  activeMenu.value = menuKey

  // 根据菜单键值控制面板显示
  /**
   * 树形结构面板 showLeftPanel.value = !showLeftPanel.value
   * 气源设备状态面板 showGasStatusPanel.value = !showGasStatusPanel.value
   * 底部表格面板 showBottomPanel.value = !showBottomPanel.value
   */
  switch (menuKey) {
    case '/pipe-network/gas-source':
      showGasStatusPanel.value = !showGasStatusPanel.value
      break
    case '/pipe-network/end-point':
      showGasStatusPanel.value = !showGasStatusPanel.value
      break
    case '/pipe-network/distribution':
      showBottomPanel.value = !showBottomPanel.value
      break
    case 'full-analysis':
      showLeftPanel.value = true
      showBottomPanel.value = true
      break
    default:
      // 其他菜单处理
      break
  }

  // 确保地图正确调整大小
  setTimeout(() => {
    map?.updateSize()
  }, 100)
}

// 处理树节点点击
// const handleTreeNodeClick = (nodeData: any) => {
//   console.log('树节点点击:', nodeData)

//   // 如果节点有坐标数据，聚焦到该位置
//   if (nodeData.data?.coordinates && map) {
//     focusOnCoordinates(nodeData.data.coordinates)
//   }
// }

// 处理表格行点击
const handleTableRowClick = (rowData: any) => {
  console.log('表格行点击:', rowData)

  // 如果行数据有坐标，聚焦到该位置
  if (rowData.data?.coordinates && map) {
    focusOnCoordinates(rowData.data.coordinates)
  }
}

// 聚焦到坐标位置
// const focusOnCoordinates = (coordinates: any) => {
//   if (!map) return

//   const view = map.getView()

//   if (Array.isArray(coordinates[0])) {
//     // 处理线状要素（管线）
//     const extent = new LineString(coordinates.map((coord: number[]) => fromLonLat(coord))).getExtent()
//     view.fit(extent, { duration: 500, padding: [50, 50, 50, 50] })
//   } else {
//     // 处理点状要素
//     view.animate({
//       center: fromLonLat(coordinates),
//       zoom: 15,
//       duration: 500
//     })
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
</style>
