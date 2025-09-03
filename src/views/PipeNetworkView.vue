<template>
  <Header />
  <div class="pipe-network-view">
    <!-- 地图容器 -->
    <div class="map-content">
      <div class="map-container">
        <div id="ol-map" ref="mapContainer" class="ol-map"></div>

        <!-- 地图信息组件 - 调整位置避免重叠 -->
        <MapInfoDisplay :scale="scale" :longitude="longitude" :latitude="latitude" :altitude="altitude"
          :viewAngle="viewAngle" :viewHeight="viewHeight" class="info-display-adjusted" />

        <!-- 右下角的地图控制组件 -->
        <MapControls @zoom-in="zoomIn" @zoom-out="zoomOut" @reset-view="resetView" :layers="selectedLayers"
          @update:layers="selectedLayers = $event" />

        <!-- 动态组件容器 -->
        <!-- <DynamicPanelContainer /> -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from '@/components/layout/HeaderWithMenu.vue'
import MapInfoDisplay from '@/components/map/MapInfoDisplay.vue'
import MapControls from '@/components/map/MapControls.vue'
import DynamicPanelContainer from './GasPipeControl/DynamicPanelContainer.vue'
import { ref, onMounted, onUnmounted } from 'vue'
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

import { Close } from '@element-plus/icons-vue'

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
</style>
