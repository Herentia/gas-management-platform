<template>
  <header class="header">
    <div class="header-container">
      <!-- 左侧logo和标题 -->
      <div class="logo-container" @click="goHome">
        <el-icon class="logo-icon">
          <!-- <Fire /> -->
        </el-icon>
        <h1 class="logo-text">燃气智慧管理平台</h1>
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

    <!-- 移动端菜单按钮 -->
    <div class="mobile-menu-container">
      <el-button text class="mobile-menu-button" @click="showMobileMenu = !showMobileMenu">
        <el-icon>
          <Menu />
        </el-icon>
        菜单
      </el-button>

      <!-- 移动端菜单 -->
      <el-collapse-transition>
        <div v-show="showMobileMenu" class="mobile-menu">
          <div v-for="item in mobileMenuItems" :key="item.name" class="mobile-menu-item"
            @click="navigateTo(item.route)">
            <i :class="item.icon" class="menu-icon"></i>
            {{ item.name }}
          </div>
        </div>
      </el-collapse-transition>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const showMobileMenu = ref(false)

interface UserInfo {
  name: string
  avatar: string
  role: string
}

interface MobileMenuItem {
  name: string
  icon: string
  route: string
}

const userInfo = ref<UserInfo>({
  name: '管理员',
  avatar: 'https://picsum.photos/id/1005/40/40',
  role: '系统管理员'
})

const mobileMenuItems = ref<MobileMenuItem[]>([
  { name: '管网管理', icon: 'fa fa-sitemap', route: '/pipe-network' },
  { name: '巡检管理', icon: 'fa fa-walking', route: '/inspection' },
  { name: '工程管理', icon: 'fa fa-building', route: '/engineering' },
  { name: '客服管理', icon: 'fa fa-users', route: '/customer-service' }
])

const goHome = () => {
  router.push('/')
  showMobileMenu.value = false
}

const navigateTo = (route: string) => {
  router.push(route)
  showMobileMenu.value = false
}
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
  max-width: 1200px;
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
}

.logo-icon {
  font-size: 1.5rem;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
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
</style>
