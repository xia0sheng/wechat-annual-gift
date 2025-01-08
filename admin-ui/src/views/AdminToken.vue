<template>
  <div class="admin-token">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>管理员 Token</span>
          <el-button type="primary" @click="copyToken">复制 Token</el-button>
        </div>
      </template>

      <div class="token-section">
        <h3>JWT Token</h3>
        <el-alert
          type="warning"
          :closable="false"
          show-icon
        >
          请妥善保管您的 Token，不要泄露给他人。
        </el-alert>
        
        <div class="token-display">
          <el-input
            type="textarea"
            v-model="token"
            :rows="3"
            readonly
          />
        </div>

        <div class="token-info">
          <h4>Token 信息</h4>
          <div class="info-item">
            <label>用户 ID：</label>
            <span>{{ decodedToken.id }}</span>
          </div>
          <div class="info-item">
            <label>角色：</label>
            <span>{{ decodedToken.role }}</span>
          </div>
          <div class="info-item">
            <label>过期时间：</label>
            <span>{{ formatDate(decodedToken.exp * 1000) }}</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export default {
  setup() {
    const router = useRouter()
    const token = ref('')
    const decodedToken = ref({})

    const decodeToken = (token) => {
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))
        return JSON.parse(jsonPayload)
      } catch (e) {
        console.error('Token 解析失败:', e)
        return {}
      }
    }

    const copyToken = async () => {
      try {
        await navigator.clipboard.writeText(token.value)
        ElMessage.success('Token 已复制到剪贴板')
      } catch (err) {
        ElMessage.error('复制失败，请手动复制')
        console.error('复制失败:', err)
      }
    }

    const formatDate = (timestamp) => {
      if (!timestamp) return '-'
      try {
        return new Date(timestamp).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      } catch (e) {
        return '-'
      }
    }

    onMounted(() => {
      const storedToken = localStorage.getItem('token')
      if (!storedToken) {
        ElMessage.error('未找到 Token，请重新登录')
        router.push('/login')
        return
      }

      token.value = storedToken
      decodedToken.value = decodeToken(storedToken)

      // 检查是否是管理员
      if (decodedToken.value.role !== 'admin') {
        ElMessage.error('无权访问此页面')
        router.push('/')
        return
      }
    })

    return {
      token,
      decodedToken,
      copyToken,
      formatDate
    }
  }
}
</script>

<style scoped>
.admin-token {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.token-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.token-display {
  margin: 20px 0;
}

.token-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 4px;
}

.token-info h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.info-item {
  margin-bottom: 10px;
  display: flex;
  align-items: flex-start;
}

.info-item label {
  font-weight: bold;
  width: 100px;
  margin-right: 10px;
  color: #606266;
}

.info-item span {
  color: #303133;
}
</style> 