<template>
  <div class="profile">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>个人信息</span>
        </div>
      </template>

      <div v-if="user" class="user-info">
        <el-avatar :size="100" :src="user.headimgurl" />
        <div class="info-item">
          <label>昵称：</label>
          <span>{{ user.nickname }}</span>
        </div>
        <div class="info-item">
          <label>性别：</label>
          <span>{{ user.sex === 1 ? '男' : user.sex === 2 ? '女' : '未知' }}</span>
        </div>
        <div class="info-item">
          <label>地区：</label>
          <span>{{ user.province }} {{ user.city }}</span>
        </div>
        <div class="info-item">
          <label>最后登录：</label>
          <span>{{ formatDate(user.last_login) }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

export default {
  setup() {
    const user = ref(null)

    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('/users/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        user.value = response.data.data
      } catch (error) {
        ElMessage.error('获取用户信息失败')
        console.error(error)
      }
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleString()
    }

    onMounted(() => {
      fetchUserInfo()
    })

    return {
      user,
      formatDate
    }
  }
}
</script>

<style scoped>
.profile {
  padding: 20px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.info-item {
  width: 100%;
  max-width: 300px;
}

.info-item label {
  font-weight: bold;
  margin-right: 10px;
}
</style> 