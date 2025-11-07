<template>
  <header class="header">
    <div class="header-container">
      <!-- 左侧logo和标题 -->
      <div class="logo-container" @click="goHome">
        <el-icon class="logo-icon">
          <i class="fa fa-fire text-2xl"></i>
        </el-icon>
        <h1 class="logo-text">燃气智慧管理平台</h1>
      </div>

      <!-- 中间动态菜单 -->
      <div class="nav-menu-container">
        <el-menu :key="menuKey" :default-active="activeMenu" mode="horizontal" background-color="#165DFF"
          text-color="#fff" active-text-color="#ffd04b" @select="handleMenuSelect" class="custom-horizontal-menu">
          <template v-for="item in currentMenuItems" :key="item.id">
            <!-- 一级菜单项 -->
            <el-menu-item v-if="!item.children || item.children.length === 0" :index="item.path">
              <el-icon v-if="item.icon">
                <component :is="item.icon" />
              </el-icon>
              <span class="menu-item-text">{{ item.title }}</span>
            </el-menu-item>

            <!-- 带子菜单的项 -->
            <el-sub-menu v-else :index="item.path">
              <template #title>
                <el-icon v-if="item.icon">
                  <component :is="item.icon" />
                </el-icon>
                <span class="menu-item-text">{{ item.title }}</span>
              </template>
              <el-menu-item v-for="child in item.children" :key="child.id" :index="child.path">
                <el-icon v-if="child.icon">
                  <component :is="child.icon" />
                </el-icon>
                <span>{{ child.title }}</span>
              </el-menu-item>
            </el-sub-menu>
          </template>
        </el-menu>
      </div>

      <!-- 右侧用户操作区 -->
      <div class="user-actions">
        <!-- 通知铃铛 -->
        <el-dropdown trigger="click" placement="bottom-end">
          <el-badge :value="5" class="badge-container">
            <el-icon class="bell-icon">
              <Bell />
            </el-icon>
          </el-badge>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>
                <div class="notification-item">
                  <el-icon class="notification-icon danger">
                    <Warning />
                  </el-icon>
                  <div>
                    <p class="notification-title">调压箱压力过高</p>
                    <p class="notification-detail">城东片区 - 10:23</p>
                  </div>
                </div>
              </el-dropdown-item>
              <el-dropdown-item>
                <div class="notification-item">
                  <el-icon class="notification-icon warning">
                    <Warning />
                  </el-icon>
                  <div>
                    <p class="notification-title">工程进度滞后</p>
                    <p class="notification-detail">南部新区管网 - 09:15</p>
                  </div>
                </div>
              </el-dropdown-item>
              <el-dropdown-item divided>
                <div class="view-all">
                  查看所有通知
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 用户信息 -->
        <el-dropdown trigger="click" placement="bottom-end">
          <div class="user-info">
            <el-avatar :size="32" :src="userInfo.avatar" class="user-avatar" />
            <span class="user-name">{{ userInfo.name }}</span>
            <el-icon class="dropdown-arrow">
              <ArrowDown />
            </el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>
                <el-icon>
                  <User />
                </el-icon>
                个人中心
              </el-dropdown-item>
              <el-dropdown-item>
                <el-icon>
                  <Setting />
                </el-icon>
                系统设置
              </el-dropdown-item>
              <el-dropdown-item divided>
                <el-icon>
                  <SwitchButton />
                </el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, markRaw, type Component } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Bell,
  Warning,
  ArrowDown,
  User,
  Setting,
  SwitchButton,
  Monitor,
  DataBoard,
  WarningFilled,
  MapLocation,
  Tools,
  UserFilled,
  TrendCharts,
  Position,
  Document,
  ChatDotRound
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 接收菜单类型props
interface Props {
  menuType?: string
}

const props = withDefaults(defineProps<Props>(), {
  menuType: 'pipe-network'
})

const menuKey = ref(0)

interface UserInfo {
  name: string
  avatar: string
  role: string
}

interface MenuItem {
  id: number
  title: string
  path: string
  icon?: Component
  children?: MenuItem[]
}

const userInfo = ref<UserInfo>({
  name: '管理员',
  avatar: 'https://picsum.photos/id/1005/40/40',
  role: '系统管理员'
})

// 所有菜单配置 - 包含一级菜单和子菜单
const allMenuItems = {
  // 管网管理菜单
  'pipe-network': [
    // {
    //   id: 1,
    //   title: '监测分析',
    //   path: '/pipe-network/monitor',
    //   icon: markRaw(TrendCharts),
    //   children: [
    //     {
    //       id: 11,
    //       title: '气源流量压力监测',
    //       path: '/pipe-network/gas-source',
    //       icon: markRaw(Monitor)
    //     },
    //     {
    //       id: 12,
    //       title: '末端流量压力监测',
    //       path: '/pipe-network/end-point',
    //       icon: markRaw(Monitor)
    //     }
    //   ]
    // },
    {
      id: 1,
      title: '气源流量压力监测',
      path: '/pipe-network/gas-source',
      icon: markRaw(Monitor),
      children: []
    },
    {
      id: 2,
      title: '末端流量压力监测',
      path: '/pipe-network/end-point',
      icon: markRaw(Monitor),
      children: []
    },
    {
      id: 3,
      title: '管网分布',
      path: '/pipe-network/distribution',
      icon: markRaw(MapLocation),
      children: []
    },
    {
      id: 4,
      title: '设备管理',
      path: '/pipe-network/equipment',
      icon: markRaw(Tools),
      children: []
      // children: [
      //   {
      //     id: 31,
      //     title: '设备设施',
      //     path: '/pipe-network/equipment-list',
      //     icon: markRaw(Tools)
      //   },
      //   {
      //     id: 32,
      //     title: '设备维护',
      //     path: '/pipe-network/equipment-maintenance',
      //     icon: markRaw(Tools)
      //   }
      // ]
    }
  ],
  // 巡检管理菜单
  'inspection': [
    {
      id: 1,
      title: '市政管网',
      path: '/inspection/tasks',
      icon: markRaw(MapLocation),
      children: []
    },
    {
      id: 2,
      title: '庭院管网',
      path: '/inspection/courtyard',
      icon: markRaw(Position),
      children: []
      // children: [
      //   {
      //     id: 21,
      //     title: '巡检路线',
      //     path: '/inspection/routes',
      //     icon: markRaw(Monitor)
      //   },
      //   {
      //     id: 22,
      //     title: '安检记录',
      //     path: '/inspection/records',
      //     icon: markRaw(WarningFilled)
      //   }
      // ]
    },
    {
      id: 3,
      title: '入户安检',
      path: '/inspection/HouseholdSafetyInspection',
      icon: markRaw(Document),
      children: []
    },
    {
      id: 4,
      title: '设备设施',
      path: '/inspection/equipments',
      icon: markRaw(WarningFilled),
      children: []
    }
  ],
  // 工程管理菜单
  'engineering': [
    {
      id: 1,
      title: '服务应急抢险',
      path: '/engineering/emergency',
      icon: markRaw(WarningFilled),
      children: []
    },
    {
      id: 2,
      title: '工程建设管理',
      path: '/engineering/engineeringManagement',
      icon: markRaw(DataBoard),
      children: []
    },
  ],
  // 客服管理菜单
  'customer-service': [
    {
      id: 1,
      title: '客户服务',
      path: '/customer/service',
      icon: markRaw(UserFilled),
      children: [
        {
          id: 11,
          title: '服务请求',
          path: '/customer/requests',
          icon: markRaw(UserFilled)
        },
        {
          id: 12,
          title: '咨询管理',
          path: '/customer/consultation',
          icon: markRaw(ChatDotRound)
        }
      ]
    },
    {
      id: 2,
      title: '用户信息',
      path: '/customer/info',
      icon: markRaw(User),
      children: []
    },
    {
      id: 3,
      title: '投诉处理',
      path: '/customer/complaints',
      icon: markRaw(WarningFilled),
      children: []
    },
    {
      id: 4,
      title: '服务评价',
      path: '/customer/feedback',
      icon: markRaw(DataBoard),
      children: []
    }
  ]
}

// 计算当前显示的菜单项
const currentMenuItems = computed(() => {
  return allMenuItems[props.menuType as keyof typeof allMenuItems] || allMenuItems['pipe-network']
})

// 获取当前激活的菜单项
const activeMenu = computed(() => {
  const { path } = route
  return path
})

const emit = defineEmits<{
  menuClick: [key: string]
}>()

const handleMenuClick = (key: string) => {
  emit('menuClick', key)
}

// 处理菜单选择
const handleMenuSelect = (index: string) => {
  handleMenuClick(index)
}

const goHome = () => {
  router.push('/')
}

// 监听菜单类型变化，重新渲染菜单
watch(() => props.menuType, () => {
  nextTick(() => {
    menuKey.value++
  })
})

onMounted(() => {
  // 强制重新渲染菜单
  nextTick(() => {
    menuKey.value++
  })
})
</script>

<style scoped>
.header {
  background-color: #165DFF;
  color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 50;
  transition: all 0.3s;
}

.header-container {
  max-width: 1800px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  flex-shrink: 0;
  min-width: 200px;
}

.logo-icon {
  font-size: 1.5rem;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  white-space: nowrap;
}

.nav-menu-container {
  flex: 1;
  display: flex;
  justify-content: center;
  margin: 0 2rem;
  min-width: 0;
}

/* 自定义横向菜单样式 - 解决折叠问题 */
:deep(.custom-horizontal-menu) {
  border-bottom: none;
  display: flex !important;
  flex-wrap: nowrap;
  min-width: 0;
  width: 100%;
  justify-content: center;
}

:deep(.custom-horizontal-menu .el-menu-item),
:deep(.custom-horizontal-menu .el-sub-menu .el-sub-menu__title) {
  flex-shrink: 0 !important;
  padding: 0 16px !important;
  height: 64px !important;
  line-height: 64px !important;
  border-bottom: none !important;
  white-space: nowrap !important;
  max-width: 160px !important;
  min-width: 120px !important;
  display: flex !important;
  align-items: center !important;
}

:deep(.custom-horizontal-menu .menu-item-text) {
  display: inline-block;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

:deep(.el-menu--horizontal) {
  background-color: transparent;
  border-bottom: none;
}

:deep(.el-menu--horizontal > .el-menu-item),
:deep(.el-menu--horizontal > .el-sub-menu .el-sub-menu__title) {
  color: white;
  height: 64px;
  line-height: 64px;
  border-bottom: none;
}

:deep(.el-menu--horizontal > .el-menu-item.is-active),
:deep(.el-menu--horizontal > .el-sub-menu.is-active .el-sub-menu__title) {
  color: #ffd04b;
  border-bottom: 2px solid #ffd04b;
}

:deep(.el-menu--horizontal > .el-menu-item:not(.is-disabled):hover),
:deep(.el-menu--horizontal > .el-sub-menu:not(.is-disabled):hover .el-sub-menu__title) {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

:deep(.el-menu--horizontal .el-menu--popup) {
  background-color: #165DFF;
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 140px;
}

:deep(.el-menu--horizontal .el-menu--popup .el-menu-item) {
  color: white;
  background-color: #165DFF;
  min-width: 140px;
  height: 48px;
  line-height: 48px;
}

:deep(.el-menu--horizontal .el-menu--popup .el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1);
}

:deep(.el-menu--horizontal .el-menu--popup .el-menu-item.is-active) {
  color: #ffd04b;
  background-color: rgba(255, 208, 75, 0.1);
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-shrink: 0;
  min-width: 180px;
}

.badge-container {
  cursor: pointer;
}

.bell-icon {
  font-size: 1.125rem;
  transition: color 0.3s;
}

.bell-icon:hover {
  color: #FF7D00;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.user-avatar {
  border: 2px solid white;
}

.user-name {
  display: none;
}

@media (min-width: 768px) {
  .user-name {
    display: inline;
  }
}

.dropdown-arrow {
  font-size: 0.875rem;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 0.5rem;
  gap: 0.75rem;
}

.notification-icon {
  margin-top: 0.25rem;
  font-size: 1rem;
}

.notification-icon.danger {
  color: #F53F3F;
}

.notification-icon.warning {
  color: #FF7D00;
}

.notification-title {
  font-weight: 500;
  color: #1D2129;
  margin-bottom: 0.25rem;
}

.notification-detail {
  font-size: 0.875rem;
  color: #86909C;
}

.view-all {
  text-align: center;
  color: #165DFF;
  cursor: pointer;
  padding: 0.5rem;
}

/* Element Plus 样式覆盖 */
:deep(.el-badge__content) {
  background-color: #F53F3F;
  border-color: white;
}

:deep(.el-dropdown-menu__item) {
  padding: 0.75rem 1rem;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .logo-text {
    font-size: 1.1rem;
  }

  :deep(.custom-horizontal-menu .el-menu-item),
  :deep(.custom-horizontal-menu .el-sub-menu .el-sub-menu__title) {
    padding: 0 12px !important;
    min-width: 100px !important;
    max-width: 140px !important;
  }

  :deep(.custom-horizontal-menu .menu-item-text) {
    max-width: 80px;
  }
}

@media (max-width: 1200px) {
  .header-container {
    padding: 0 0.5rem;
  }

  .nav-menu-container {
    margin: 0 1rem;
  }

  .logo-container {
    min-width: 160px;
  }

  .logo-text {
    font-size: 1rem;
  }

  :deep(.custom-horizontal-menu .el-menu-item),
  :deep(.custom-horizontal-menu .el-sub-menu .el-sub-menu__title) {
    padding: 0 10px !important;
    min-width: 90px !important;
    max-width: 120px !important;
  }

  :deep(.custom-horizontal-menu .menu-item-text) {
    max-width: 70px;
    font-size: 0.9rem;
  }
}

@media (max-width: 1024px) {
  .nav-menu-container {
    margin: 0 0.5rem;
  }

  :deep(.custom-horizontal-menu .el-menu-item),
  :deep(.custom-horizontal-menu .el-sub-menu .el-sub-menu__title) {
    padding: 0 8px !important;
    min-width: 80px !important;
    max-width: 110px !important;
  }

  :deep(.custom-horizontal-menu .menu-item-text) {
    max-width: 60px;
    font-size: 0.85rem;
  }
}

@media (max-width: 900px) {
  .nav-menu-container {
    display: none;
  }

  .header-container {
    justify-content: space-between;
  }
}

/* 防止子菜单箭头被截断 */
:deep(.el-sub-menu .el-sub-menu__icon-arrow) {
  margin-left: 4px !important;
}
</style>
