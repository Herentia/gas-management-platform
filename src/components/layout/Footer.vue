<template>
  <footer class="footer">
    <div class="footer-container">
      <!-- 主要页脚内容 -->
      <!-- <div class="footer-content">
        <div class="company-info">
          <div class="company-logo">
            <el-icon class="logo-icon">
            </el-icon>
            <span class="company-name">燃气智慧管理平台</span>
          </div>
          <p class="company-description">提供全面的燃气系统监控与管理解决方案</p>
        </div>
        <div class="footer-links">
          <div class="quick-links">
            <a v-for="link in quickLinks" :key="link.name" :href="link.url" class="link-item" target="_blank">
              {{ link.name }}
            </a>
          </div>
          <div class="contact-methods">
            <a v-for="contact in contacts" :key="contact.type" :href="contact.url" class="contact-icon"
              :title="contact.title" target="_blank">
              <i :class="contact.icon"></i>
            </a>
          </div>
        </div>
      </div> -->

      <!-- 系统状态指示器 -->
      <div class="status-indicators">
        <div class="status-item">
          <span class="status-dot success"></span>
          <span class="status-text">系统运行正常</span>
        </div>
        <div class="status-item">
          <span class="status-dot warning"></span>
          <span class="status-text">2个警告</span>
        </div>
        <div class="status-item">
          <span class="status-dot danger"></span>
          <span class="status-text">3个异常</span>
        </div>
      </div>

      <!-- 版权信息和备案 -->
      <div class="copyright-section">
        <p class="copyright-text">
          © 2025 燃气智慧管理平台 版权所有
        </p>

        <div class="version-info">
          <span>版本号: v1.0.0</span>
          <span>最后更新: 2025-09-15</span>
          <a href="https://beian.miit.gov.cn" target="_blank" class="record-link">
            鄂ICP备12345678号-1
          </a>
        </div>
      </div>

    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface QuickLink {
  name: string
  url: string
}

interface Contact {
  type: string
  icon: string
  url: string
  title: string
}

const quickLinks = ref<QuickLink[]>([
  { name: '帮助中心', url: '/help' },
  { name: '关于我们', url: '/about' },
  { name: '服务条款', url: '/terms' },
  { name: '隐私政策', url: '/privacy' },
  { name: '联系我们', url: '/contact' }
])

const contacts = ref<Contact[]>([
  {
    type: 'email',
    icon: 'fa fa-envelope',
    url: 'mailto:support@gas-management.com',
    title: '发送邮件'
  },
  {
    type: 'phone',
    icon: 'fa fa-phone',
    url: 'tel:400-123-4567',
    title: '拨打热线'
  },
  {
    type: 'wechat',
    icon: 'fa fa-wechat',
    url: '#',
    title: '微信公众号'
  },
  {
    type: 'weibo',
    icon: 'fa fa-weibo',
    url: 'https://weibo.com',
    title: '关注微博'
  }
])
</script>

<style scoped>
.footer {
  background-color: white;
  border-top: 1px solid #E5E7EB;
  padding: 1rem 0;
  margin-top: auto;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05);
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (min-width: 768px) {
  .footer-content {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
}

.company-info {
  text-align: center;
}

@media (min-width: 768px) {
  .company-info {
    text-align: left;
  }
}

.company-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

@media (min-width: 768px) {
  .company-logo {
    justify-content: flex-start;
  }
}

.logo-icon {
  color: #165DFF;
}

.company-name {
  font-weight: 600;
  color: #1D2129;
}

.company-description {
  font-size: 0.875rem;
  color: #6B7280;
}

.footer-links {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

@media (min-width: 768px) {
  .footer-links {
    align-items: flex-end;
  }
}

.quick-links {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.link-item {
  font-size: 0.875rem;
  color: #6B7280;
  text-decoration: none;
  transition: color 0.3s;
}

.link-item:hover {
  color: #165DFF;
}

.contact-methods {
  display: flex;
  gap: 1rem;
}

.contact-icon {
  color: #9CA3AF;
  font-size: 1.125rem;
  transition: color 0.3s;
  text-decoration: none;
}

.contact-icon:hover {
  color: #165DFF;
}

.copyright-section {
  border-top: 1px solid #F3F4F6;
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (min-width: 768px) {
  .copyright-section {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.copyright-text {
  color: #6B7280;
  font-size: 0.875rem;
  text-align: center;
}

@media (min-width: 768px) {
  .copyright-text {
    text-align: left;
  }
}

.version-info {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #6B7280;
  justify-content: center;
  flex-wrap: wrap;
}

@media (min-width: 768px) {
  .version-info {
    justify-content: flex-end;
  }
}

.record-link {
  color: #6B7280;
  text-decoration: none;
  transition: color 0.3s;
}

.record-link:hover {
  color: #165DFF;
}

.status-indicators {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
  font-size: 0.75rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.success {
  background-color: #00B42A;
}

.status-dot.warning {
  background-color: #FF7D00;
}

.status-dot.danger {
  background-color: #F53F3F;
}

.status-text {
  color: #6B7280;
}

:deep(.el-icon) {
  vertical-align: middle;
}
</style>
