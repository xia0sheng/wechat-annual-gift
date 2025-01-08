<template>
  <el-container class="layout-container">
    <el-header>
      <div class="header-content">
        <h2>微信用户管理系统</h2>
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

.el-header {
  background-color: #409EFF;
  color: white;
  line-height: 60px;
}
</style> 