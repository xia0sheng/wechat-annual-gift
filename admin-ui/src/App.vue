<template>
  <el-container class="layout-container">
    <el-header>
      <div class="header-content">
        <div class="header-left">
          <h2>年会节目管理系统</h2>
          
          <!-- 移动端汉堡菜单按钮 -->
          <el-button
            v-if="isMobile"
            class="menu-toggle"
            @click="showMobileMenu = !showMobileMenu"
          >
            <i :class="showMobileMenu ? 'el-icon-close' : 'el-icon-menu'"></i>
          </el-button>

          <!-- PC端导航菜单 -->
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
        </div>
        <el-button v-if="isLoggedIn" @click="logout" type="danger" size="small">
          退出登录
        </el-button>
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
import { computed, onMounted, watch } from 'vue'
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
    
    // 检测设备类型
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768
    }
    
    onMounted(() => {
      checkMobile()
      window.addEventListener('resize', checkMobile)
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
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
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
    flex-direction: column;
    padding: 10px;
  }

  .header-left {
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .nav-menu {
    flex-direction: column;
    width: 100%;
    gap: 5px;
  }

  .nav-item {
    display: block;
    padding: 8px 15px;
    text-align: center;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  .el-header {
    height: auto !important;
    line-height: normal;
  }

  h2 {
    margin: 10px 0;
  }
}

.menu-toggle {
  padding: 7px;
  margin-left: 15px;
  background: transparent;
  border: none;
  color: white;
}

.menu-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}

.mobile-menu {
  position: absolute;
  top: 100%;
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

/* 移动端适配 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 15px;
  }
  
  h2 {
    font-size: 18px;
    margin: 0;
  }
  
  .header-left {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
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
</style> 