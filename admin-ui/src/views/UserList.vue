<template>
  <div class="user-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <el-button type="primary" @click="refreshData">刷新</el-button>
        </div>
      </template>

      <el-table :data="users" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="openid" label="OpenID" width="280" />
        <el-table-column prop="sex" label="性别" width="80">
          <template #default="scope">
            {{ scope.row.sex === 1 ? '男' : scope.row.sex === 2 ? '女' : '未知' }}
          </template>
        </el-table-column>
        <el-table-column label="头像" width="100">
          <template #default="scope">
            <el-image
              style="width: 40px; height: 40px"
              :src="scope.row.headimgurl"
              fit="cover"
              :preview-src-list="[scope.row.headimgurl]"
            />
          </template>
        </el-table-column>
        <el-table-column prop="city" label="城市" />
        <el-table-column prop="province" label="省份" />
        <el-table-column label="最后登录时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.last_login) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
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
    const users = ref([])
    const loading = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)

    const fetchUsers = async () => {
      loading.value = true
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`/users`, {
          params: {
            page: currentPage.value,
            limit: pageSize.value
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        console.log('用户列表响应:', response.data);
        users.value = response.data.data.users
        total.value = response.data.data.pagination.total
      } catch (error) {
        ElMessage.error(`获取用户列表失败: ${error.response?.data?.message || error.message}`)
        console.error('获取用户列表错误:', error.response?.data || error)
      } finally {
        loading.value = false
      }
    }

    const handleSizeChange = (val) => {
      pageSize.value = val
      fetchUsers()
    }

    const handleCurrentChange = (val) => {
      currentPage.value = val
      fetchUsers()
    }

    const refreshData = () => {
      fetchUsers()
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleString()
    }

    onMounted(() => {
      fetchUsers();
    });

    return {
      users,
      loading,
      currentPage,
      pageSize,
      total,
      handleSizeChange,
      handleCurrentChange,
      refreshData,
      formatDate
    }
  }
}
</script>

<style scoped>
.user-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style> 