<template>
  <el-container class="layout-container">
    <el-header>
      <!-- 添加调试信息 -->
      <div style="position: fixed; top: 0; left: 0; background: rgba(0,0,0,0.5); color: white; padding: 5px; font-size: 12px; z-index: 9999;">
        isMobile: {{ isMobile }}<br>
        isLoggedIn: {{ isLoggedIn }}<br>
        showMobileMenu: {{ showMobileMenu }}
      </div>

      <div class="header-content">
        <!-- 左侧标题和菜单按钮 -->
        <div class="header-left">
          <h2>年会节目管理系统</h2>
        </div>

        <!-- 中间的导航菜单（PC端） -->
        <div v-if="!isMobile && isLoggedIn" class="nav-menu">
          <router-link 
            to="/programs" 
            class="nav-item"
            :class="{ active: $route.path === '/programs' }"
          >
            节目列表
          </router-link>
          <router-link 
            v-if="isAdmin" 
            to="/users" 
            class="nav-item"
            :class="{ active: $route.path === '/users' }"
          >
            用户管理
          </router-link>
          <router-link 
            v-if="isAdmin" 
            to="/admin-token" 
            class="nav-item"
            :class="{ active: $route.path === '/admin-token' }"
          >
            Token 管理
          </router-link>
          <router-link 
            v-if="isAdmin" 
            to="/admin/big-screen" 
            class="nav-item"
            :class="{ active: $route.path === '/admin/big-screen' }"
          >
            大屏展示
          </router-link>
          <router-link 
            to="/profile" 
            class="nav-item"
            :class="{ active: $route.path === '/profile' }"
          >
            个人信息
          </router-link>
        </div>

        <!-- 右侧操作区 -->
        <div class="header-right">
          <!-- 移动端汉堡菜单按钮 -->
          <el-button
            v-if="isMobile && isLoggedIn"
            class="menu-toggle"
            @click="showMobileMenu = !showMobileMenu"
            style="z-index: 1000;"
          >
            {{ showMobileMenu ? '关闭' : '菜单' }}
          </el-button>

          <!-- 退出按钮 -->
          <el-button 
            v-if="isLoggedIn" 
            @click="logout" 
            type="danger" 
            size="small"
          >
            退出登录
          </el-button>
        </div>
      </div>

      <!-- 移动端折叠菜单 -->
      <transition name="slide-fade">
        <div v-if="isMobile && showMobileMenu && isLoggedIn" class="mobile-menu">
          <router-link 
            to="/programs" 
            class="mobile-nav-item"
            :class="{ active: $route.path === '/programs' }"
            @click="showMobileMenu = false"
          >
            节目列表
          </router-link>
          <router-link 
            v-if="isAdmin" 
            to="/users" 
            class="mobile-nav-item"
            :class="{ active: $route.path === '/users' }"
            @click="showMobileMenu = false"
          >
            用户管理
          </router-link>
          <router-link 
            v-if="isAdmin" 
            to="/admin-token" 
            class="mobile-nav-item"
            :class="{ active: $route.path === '/admin-token' }"
            @click="showMobileMenu = false"
          >
            Token 管理
          </router-link>
          <router-link 
            v-if="isAdmin" 
            to="/admin/big-screen" 
            class="mobile-nav-item"
            :class="{ active: $route.path === '/admin/big-screen' }"
            @click="showMobileMenu = false"
          >
            大屏展示
          </router-link>
          <router-link 
            to="/profile" 
            class="mobile-nav-item"
            :class="{ active: $route.path === '/profile' }"
            @click="showMobileMenu = false"
          >
            个人信息
          </router-link>
        </div>
      </transition>
    </el-header>
    <el-main>
      <router-view></router-view>
    </el-main>
  </el-container>
</template>

<script>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

export default {
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    const isLoggedIn = computed(() => !!localStorage.getItem('token'))
    const isAdmin = computed(() => {
      const token = localStorage.getItem('token')
      if (!token) return false
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]))
        return decoded.role === 'admin'
      } catch (e) {
        return false
      }
    })

    const logout = () => {
      localStorage.removeItem('token')
      window.location.replace('/admin/#/login')
    }

    // 监听路由变化
    watch(() => route.path, (newPath) => {
      // 确保在路由变化时重新计算登录状态
      if (newPath !== '/login') {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
        }
      }
    })

    const isMobile = ref(false)
    const showMobileMenu = ref(false)
    
    // 修改检测设备类型的方法
    const checkMobile = () => {
      const width = window.innerWidth
      isMobile.value = width <= 768
      console.log('Window width:', width, 'isMobile:', isMobile.value)
    }
    
    onMounted(() => {
      // 立即检查一次
      checkMobile()
      
      // 添加调试日志
      console.log('Initial check - isMobile:', isMobile.value)
      
      // 添加 resize 监听
      window.addEventListener('resize', () => {
        checkMobile()
        console.log('Resize event - isMobile:', isMobile.value)
      })
      
      axios.interceptors.response.use(
        response => response,
        error => {
          if (error.response?.status === 401) {
            localStorage.removeItem('token')
            router.push('/login')
          }
          return Promise.reject(error)
        }
      )
    })
    
    onUnmounted(() => {
      window.removeEventListener('resize', checkMobile)
    })

    return {
      isMobile,
      showMobileMenu,
      isLoggedIn,
      isAdmin,
      logout
    }
  }
}
</script>

<style>
.layout-container {
  height: 100vh;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 100%;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.el-header {
  background-color: #409EFF;
  color: white;
  line-height: 60px;
  padding: 0;
}

.nav-menu {
  display: flex;
  gap: 20px;
}

.nav-item {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  padding: 0 15px;
  font-size: 14px;
  transition: all 0.3s;
}

.nav-item:hover {
  color: white;
}

.nav-item.active {
  color: #ffd04b;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 15px;
  }

  h2 {
    font-size: 16px;
    margin: 0;
    white-space: nowrap;
  }

  .nav-menu {
    display: none;
  }

  .header-right {
    gap: 5px;
  }

  .menu-toggle {
    padding: 5px;
  }
}

.menu-toggle {
  padding: 7px;
  background: transparent;
  border: none;
  color: white;
  font-size: 20px;
}

.menu-toggle:hover,
.menu-toggle:focus {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.mobile-menu {
  position: absolute;
  top: 60px;
  left: 0;
  right: 0;
  background-color: #409EFF;
  padding: 10px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
  z-index: 100;
}

.mobile-nav-item {
  display: block;
  padding: 12px 15px;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  margin: 5px 0;
  transition: all 0.3s;
}

.mobile-nav-item:hover,
.mobile-nav-item.active {
  background-color: rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
  .el-button--small {
    padding: 8px 15px;
    margin-left: 10px;
  }
}

/* 菜单动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* 确保移动端样式正确应用 */
@media screen and (max-width: 768px) {
  .header-content {
    padding: 0 15px;
    height: 60px;
  }

  .header-right {
    position: relative;
    z-index: 1000;
  }

  .menu-toggle {
    display: flex !important;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin-right: 10px;
    background: rgba(255, 255, 255, 0.1) !important;
    border-radius: 4px;
  }

  .mobile-menu {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    background-color: #409EFF;
    padding: 10px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
    z-index: 999;
  }
}
</style> 