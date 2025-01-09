<template>
  <el-container class="layout-container">
    <el-header>
      <div class="header-content">
        <div class="header-left">
          <h2>年会节目管理系统</h2>
          <div class="nav-menu" v-if="isLoggedIn">
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

    onMounted(() => {
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

    return {
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
</style> 