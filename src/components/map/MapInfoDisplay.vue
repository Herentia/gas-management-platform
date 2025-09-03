<template>
  <div class="map-info-display">
    <!-- <div class="info-header">
      <span class="info-title">清吉铁路</span>
      <span class="info-scale">比例尺：{{ scale }}</span>
    </div> -->
    <div class="info-details">
      <div class="info-row">
        <div class="info-item">
          <span class="label">比例尺：</span>
          <span class="value">{{ scale }}</span>
        </div>
        <div class="info-item">
          <span class="label">经度：</span>
          <span class="value">{{ longitude }}</span>
        </div>
        <div class="info-item">
          <span class="label">纬度：</span>
          <span class="value">{{ latitude }}</span>
        </div>
        <div class="info-item">
          <span class="label">海拔：</span>
          <span class="value">{{ altitude }}</span>
        </div>
        <div class="info-item">
          <span class="label">视角：</span>
          <span class="value">{{ viewAngle }}</span>
        </div>
        <div class="info-item">
          <span class="label">视高：</span>
          <span class="value">{{ viewHeight }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  scale: {
    type: String,
    default: '300km'
  },
  longitude: {
    type: String,
    default: '96.99505373'
  },
  latitude: {
    type: String,
    default: '49.85332650'
  },
  altitude: {
    type: String,
    default: '0.00米'
  },
  viewAngle: {
    type: String,
    default: '-89.90'
  },
  viewHeight: {
    type: String,
    default: '7413725.84米'
  }
})
</script>

<style scoped>
.map-info-display {
  position: absolute;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
  font-family: 'Microsoft YaHei', sans-serif;
  min-width: auto;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.info-title {
  font-weight: bold;
  font-size: 14px;
  color: #165DFF;
}

.info-scale {
  font-size: 12px;
  color: #F53F3F;
  font-weight: 500;
  background: rgba(245, 63, 63, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.info-details {
  display: flex;
  flex-direction: column;
}

.info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  align-items: center;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  white-space: nowrap;
}

.label {
  color: #86909C;
  font-weight: 500;
}

.value {
  color: #1D2129;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  background: rgba(22, 93, 255, 0.05);
  padding: 2px 6px;
  border-radius: 3px;
  min-width: 85px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .info-row {
    gap: 10px 16px;
  }

  .info-item {
    font-size: 11px;
  }

  .value {
    min-width: 75px;
  }
}

@media (max-width: 992px) {
  .map-info-display {
    right: 10px;
    bottom: 10px;
    padding: 10px 12px;
  }

  .info-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 6px;
  }

  .info-row {
    gap: 8px 12px;
  }

  .info-item {
    font-size: 11px;
  }

  .value {
    min-width: 70px;
    padding: 1px 4px;
  }
}

@media (max-width: 768px) {
  .map-info-display {
    left: 10px;
    right: 10px;
    bottom: 70px;
    /* 避免和控制按钮重叠 */
    padding: 8px 10px;
  }

  .info-row {
    justify-content: space-between;
    gap: 6px 8px;
  }

  .info-item {
    flex: 1;
    min-width: 45%;
    justify-content: space-between;
  }

  .value {
    min-width: 60px;
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .map-info-display {
    bottom: 60px;
  }

  .info-item {
    min-width: 100%;
  }

  .info-row {
    gap: 4px;
  }
}
</style>
