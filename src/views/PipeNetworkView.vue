<template>
  <div class="pipe-network-view">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import { fromLonLat } from 'ol/proj'
import { defaults as defaultControls, ZoomToExtent } from 'ol/control'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Feature } from 'ol'
import { Point, LineString } from 'ol/geom'
import { Style, Stroke, Circle, Fill } from 'ol/style'

import {
  ZoomIn,
  ZoomOut,
  Aim,
} from '@element-plus/icons-vue'

const router = useRouter()

const layerVisible = ref(true)
const selectedLayers = ref(['pipeline', 'equipment', 'warning'])

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
    controls: defaultControls().extend([
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

  // 确保地图正确渲染
  setTimeout(() => {
    map?.updateSize()
  }, 100)
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

const refreshMap = () => {
  if (map) {
    map.updateSize()
    map.render()
  }
}

// 生命周期
onMounted(() => {
  initMap()
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
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
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  padding: 8px 0;
}

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.el-card__header) {
  padding: 12px 16px;
}

:deep(.el-card__body) {
  padding: 16px;
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
  .map-controls {
    right: 10px;
    top: 10px;
  }

  .control-group {
    padding: 8px;
  }

  .layer-control {
    left: 10px;
    top: 10px;
    max-width: 200px;
  }

  :deep(.el-card) {
    font-size: 14px;
  }
}

/* 确保地图控件按钮样式 */
:deep(.el-button) {
  width: 36px;
  height: 36px;
}

:deep(.el-button.is-circle) {
  padding: 8px;
}

/* 移除所有可能的外部边距和内边距 */
* {
  box-sizing: border-box;
}

body,
html {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* 确保地图容器没有额外的间距 */
#ol-map {
  margin: 0;
  padding: 0;
}

/* 修复可能的外部样式影响 */
:deep(.ol-viewport) {
  border-radius: 0 !important;
}

:deep(.ol-control) {
  margin: 0 !important;
}
</style>
