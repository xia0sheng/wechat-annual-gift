<template>
  <el-container class="layout-container">
    <el-header>
      <div class="header-content">
        <div class="header-left">
          <h2>年会节目管理系统</h2>
          <el-menu
            v-if="isLoggedIn"
            mode="horizontal"
            :router="true"
            :default-active="$route.path"
          >
            <el-menu-item index="/programs">节目列表</el-menu-item>
            <el-menu-item v-if="isAdmin" index="/users">用户管理</el-menu-item>
            <el-menu-item index="/profile">个人信息</el-menu-item>
          </el-menu>
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
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  setup() {
    const router = useRouter()
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
      router.push('/login')
    }

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
}

.el-menu {
  border-bottom: none !important;
}

.el-menu--horizontal > .el-menu-item {
  border-bottom: none !important;
}

.el-menu--horizontal > .el-menu-item {
  color: white !important;
}

.el-menu--horizontal > .el-menu-item.is-active {
  color: #ffd04b !important;
  border-bottom-color: #ffd04b !important;
}
</style> 