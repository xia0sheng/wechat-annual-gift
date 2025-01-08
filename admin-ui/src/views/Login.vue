<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h3 class="login-title">登录管理系统</h3>
      </template>
      
      <el-form :model="form" label-width="0px">
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleWechatLogin"
            style="width: 100%"
          >
            微信登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  setup() {
    const loading = ref(false)
    const router = useRouter()

    const handleWechatLogin = () => {
      loading.value = true;
      window.location.href = 'https://wx.thunis.com/wechat/auth'
    }

    return {
      loading,
      handleWechatLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
}

.login-card {
  width: 400px;
}

.login-title {
  text-align: center;
  margin: 0;
}
</style> 