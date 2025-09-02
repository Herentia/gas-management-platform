<template>
  <div class="pipe-network-view">
    <!-- 顶部导航 -->
    <div class="view-header">
      <div class="header-left">
        <el-button class="back-btn" @click="goBack" :icon="ArrowLeft" text>
          返回
        </el-button>
        <h2 class="view-title">管网管理</h2>
      </div>
      <div class="header-actions">
        <el-button :icon="Download">导出数据</el-button>
        <el-button :icon="Printer">打印</el-button>
        <el-button type="primary" :icon="Refresh" @click="refreshMap">
          刷新地图
        </el-button>
      </div>
    </div>

    <!-- 子模块导航 -->
    <div class="sub-module-nav">
      <el-menu mode="horizontal" :default-active="activeTab" @select="handleTabSelect" class="sub-menu">
        <el-menu-item v-for="tab in tabs" :key="tab.id" :index="tab.id" :class="{ 'is-active': activeTab === tab.id }">
          <template #title>
            <i :class="tab.icon" class="menu-icon"></i>
            <span>{{ tab.name }}</span>
          </template>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 地图容器 -->
    <div class="map-content">
      <div class="map-container">
        <div id="ol-map" ref="mapContainer" class="ol-map"></div>

        <!-- 地图控制工具 -->
        <div class="map-controls">
          <div class="control-group">
            <el-tooltip content="放大" placement="left">
              <el-button :icon="ZoomIn" circle @click="zoomIn" />
            </el-tooltip>
            <el-tooltip content="缩小" placement="left">
              <el-button :icon="ZoomOut" circle @click="zoomOut" />
            </el-tooltip>
            <el-tooltip content="重置视图" placement="left">
              <el-button :icon="Aim" circle @click="resetView" />
            </el-tooltip>
          </div>
          <div class="control-group">
            <el-tooltip content="全屏" placement="left">
              <el-button :icon="FullScreen" circle @click="toggleFullScreen" />
            </el-tooltip>
          </div>
        </div>

        <!-- 图层控制 -->
        <div class="layer-control">
          <el-card class="layer-panel">
            <template #header>
              <div class="layer-header">
                <span>图层控制</span>
                <el-switch v-model="layerVisible" active-text="显示" />
              </div>
            </template>
            <div class="layer-list">
              <el-checkbox-group v-model="selectedLayers">
                <el-checkbox label="pipeline">管网线路</el-checkbox>
                <el-checkbox label="equipment">设备设施</el-checkbox>
                <el-checkbox label="warning">预警点位</el-checkbox>
                <el-checkbox label="station">场站位置</el-checkbox>
              </el-checkbox-group>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 右侧信息面板 -->
      <!-- <div class="info-panel">
        <el-tabs v-model="activeInfoTab" class="info-tabs">
          <el-tab-pane label="监测数据" name="monitor">
            <MonitorDataPanel />
          </el-tab-pane>
          <el-tab-pane label="设备列表" name="equipment">
            <EquipmentListPanel />
          </el-tab-pane>
          <el-tab-pane label="预警信息" name="alerts">
            <AlertPanel />
          </el-tab-pane>
        </el-tabs>
      </div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import { fromLonLat, transform } from 'ol/proj'
import { defaults as defaultControls, FullScreen, ZoomToExtent } from 'ol/control'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Feature } from 'ol'
import { Point, LineString } from 'ol/geom'
import { Style, Icon, Stroke, Circle, Fill } from 'ol/style'

import {
  ArrowLeft,
  Download,
  Printer,
  Refresh,
  ZoomIn,
  ZoomOut,
  Aim,
  FullScreen as FullScreenIcon
} from '@element-plus/icons-vue'

const router = useRouter()

// 子模块配置
const tabs = [
  { id: 'gas-source', name: '气源监测', icon: 'fa fa-fire' },
  { id: 'end-point', name: '末端监测', icon: 'fa fa-map-marker' },
  { id: 'distribution', name: '管网分布', icon: 'fa fa-sitemap' },
  { id: 'equipment', name: '设备设施', icon: 'fa fa-cogs' }
]

const activeTab = ref('gas-source')
const activeInfoTab = ref('monitor')
const layerVisible = ref(true)
const selectedLayers = ref(['pipeline', 'equipment', 'warning'])

// OpenLayers 地图实例
const mapContainer = ref<HTMLElement>()
let map: Map | null = null
let vectorLayer: VectorLayer<VectorSource> | null = null

// 初始化地图
const initMap = () => {
  if (!mapContainer.value) return

  // 百度地图瓦片服务（使用第三方服务）
  const baiduSource = new XYZ({
    url: 'http://online{s}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&scaler=1&p=1',
    projection: 'EPSG:3857',
    crossOrigin: 'anonymous'
  })

  // 创建地图
  map = new Map({
    target: mapContainer.value,
    layers: [
      new TileLayer({
        source: baiduSource
      })
    ],
    view: new View({
      center: fromLonLat([116.3974, 39.9093]), // 北京中心点
      zoom: 10,
      minZoom: 3,
      maxZoom: 18
    }),
    controls: defaultControls().extend([
      new FullScreen(),
      new ZoomToExtent()
    ])
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

const toggleFullScreen = () => {
  const mapElement = document.getElementById('ol-map')
  if (mapElement) {
    if (!document.fullscreenElement) {
      mapElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }
}

const refreshMap = () => {
  if (map) {
    map.updateSize()
    map.render()
  }
}

const handleTabSelect = (key: string) => {
  activeTab.value = key
  // 这里可以根据选择的标签加载不同的地图数据
}

const goBack = () => {
  router.push('/')
}

// 生命周期
onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (map) {
    map.setTarget(undefined)
  }
})

// // 组件占位
// const MonitorDataPanel = () => <div>监测数据面板 </div>
// const EquipmentListPanel = () => <div>设备列表面板 </div>
// const AlertPanel = () => <div>预警信息面板 </div>
</script>

<style scoped>
.pipe-network-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.view-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.sub-module-nav {
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.sub-menu {
  border-bottom: none;
}

.menu-icon {
  margin-right: 8px;
  width: 16px;
  text-align: center;
}

.map-content {
  flex: 1;
  display: flex;
  height: calc(100vh - 120px);
}

.map-container {
  flex: 1;
  position: relative;
  background: #e5e7eb;
}

.ol-map {
  width: 100%;
  height: 100%;
}

.map-controls {
  position: absolute;
  right: 20px;
  top: 20px;
  z-index: 1000;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.layer-control {
  position: absolute;
  left: 20px;
  top: 20px;
  z-index: 1000;
  max-width: 250px;
}

.layer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-panel {
  width: 400px;
  background: white;
  border-left: 1px solid #e5e7eb;
  overflow: hidden;
}

.info-tabs {
  height: 100%;
}

:deep(.info-tabs .el-tabs__content) {
  padding: 0;
  height: calc(100% - 55px);
}

:deep(.info-tabs .el-tab-pane) {
  height: 100%;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .info-panel {
    width: 300px;
  }
}

@media (max-width: 768px) {
  .map-content {
    flex-direction: column;
  }

  .info-panel {
    width: 100%;
    height: 300px;
    border-left: none;
    border-top: 1px solid #e5e7eb;
  }

  .layer-control {
    max-width: 200px;
  }
}
</style>
