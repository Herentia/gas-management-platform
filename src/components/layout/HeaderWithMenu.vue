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
          text-color="#fff" active-text-color="#ffd04b" @select="handleMenuSelect">
          <!-- 为每个菜单项使用唯一的 key -->
          <template v-for="item in menuItems">
            <el-menu-item v-if="!item.children" :index="item.path" :key="item.id">
              <el-icon v-if="item.icon">
                <component :is="item.icon" />
              </el-icon>
              <span>{{ item.title }}</span>
            </el-menu-item>
            <el-sub-menu v-else :index="item.path">
              <template #title>
                <el-icon v-if="item.icon">
                  <component :is="item.icon" />
                </el-icon>
                <span>{{ item.title }}</span>
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
  HomeFilled,
  Monitor,
  DataBoard,
  WarningFilled
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

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

// 模拟从后端获取菜单数据
const menuItems = ref<MenuItem[]>([])

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
  // ... 其他处理逻辑
}

// 初始化菜单
const initMenu = () => {
  menuItems.value = [
    {
      id: 1,
      title: '管网监控',
      path: '/pipe-network/gas-source',
      icon: markRaw(Monitor)
    },
    {
      id: 2,
      title: '末端监测',
      path: '/pipe-network/end-point',
      icon: markRaw(Monitor)
    },
    {
      id: 3,
      title: '管网分布',
      path: '/pipe-network/distribution',
      icon: markRaw(Monitor)
    },
    {
      id: 4,
      title: '设备设施',
      path: '/pipe-network/equipment',
      icon: markRaw(Monitor)
    }
  ]
}

// 处理菜单选择
const handleMenuSelect = (index: string) => {
  // router.push(index)
  handleMenuClick(index)
}

const goHome = () => {
  router.push('/')
}

// 监听路由变化
watch(() => route.path, (newPath) => {
  // 可以在这里处理菜单激活状态
})

onMounted(() => {
  initMenu()
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
}

.logo-icon {
  font-size: 1.5rem;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
}

.nav-menu-container {
  flex: 1;
  display: flex;
  justify-content: center;
  margin: 0 2rem;
}

:deep(.el-menu) {
  border-bottom: none;
}

:deep(.el-menu--horizontal) {
  background-color: transparent;
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
}

:deep(.el-menu--horizontal .el-menu--popup .el-menu-item) {
  color: white;
  background-color: #165DFF;
}

:deep(.el-menu--horizontal .el-menu--popup .el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1);
}

:deep(.el-menu--horizontal .el-menu--popup .el-menu-item.is-active) {
  color: #ffd04b;
  background-color: rgba(255, 208, 75, 0.1);
}

@media (min-width: 768px) {
  .logo-text {
    font-size: 1.5rem;
  }
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-shrink: 0;
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

.mobile-menu-container {
  display: block;
  padding: 0 1rem 0.5rem;
}

@media (min-width: 768px) {
  .mobile-menu-container {
    display: none;
  }
}

.mobile-menu-button {
  width: 100%;
  justify-content: center;
  color: white;
}

.mobile-menu {
  background-color: rgba(22, 93, 255, 0.9);
  margin-top: 0.5rem;
  border-radius: 0.5rem;
  padding: 0.5rem;
}

.mobile-menu-item {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  transition: background-color 0.3s;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mobile-menu-item:hover {
  background-color: rgba(22, 93, 255, 0.7);
}

.menu-icon {
  width: 1rem;
  text-align: center;
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
@media (max-width: 1024px) {
  .nav-menu-container {
    margin: 0 1rem;
  }

  :deep(.el-menu--horizontal > .el-menu-item),
  :deep(.el-menu--horizontal > .el-sub-menu .el-sub-menu__title) {
    padding: 0 0.75rem;
  }
}

@media (max-width: 768px) {
  .nav-menu-container {
    display: none;
  }

  .header-container {
    justify-content: space-between;
  }
}
</style>
