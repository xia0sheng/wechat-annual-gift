<template>
  <div class="user-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <el-button type="primary" @click="refreshData">刷新</el-button>
        </div>
      </template>

      <el-table :data="users" style="width: 100%" v-loading="loading" class="responsive-table">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="real_name" label="真实姓名" width="120">
          <template #default="scope">
            <el-input
              v-if="scope.row.editing"
              v-model="scope.row.real_name"
              size="small"
            />
            <span v-else>{{ scope.row.real_name || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="rockets" label="火箭数量" width="120">
          <template #default="scope">
            <el-input-number
              v-if="scope.row.editing"
              v-model="scope.row.rockets"
              :min="0"
              size="small"
            />
            <span v-else>{{ scope.row.rockets || 0 }}</span>
          </template>
        </el-table-column>
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
        <el-table-column label="操作" min-width="120">
          <template #default="scope">
            <div class="operation-buttons">
              <el-button
                v-if="!scope.row.editing"
                type="primary"
                size="small"
                @click="handleEdit(scope.row)"
              >
                编辑
              </el-button>
              <template v-else>
                <el-button
                  type="success"
                  size="small"
                  @click="handleSave(scope.row)"
                >
                  保存
                </el-button>
                <el-button
                  type="info"
                  size="small"
                  @click="handleCancel(scope.row)"
                >
                  取消
                </el-button>
              </template>
            </div>
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
        const response = await axios.get('/users', {
          params: {
            page: currentPage.value,
            limit: pageSize.value
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        users.value = response.data.data.users.map(user => ({
          ...user,
          editing: false,
          originalData: { ...user }
        }))
        total.value = response.data.data.pagination.total
      } catch (error) {
        ElMessage.error(`获取用户列表失败: ${error.response?.data?.message || error.message}`)
        console.error('获取用户列表错误:', error.response?.data || error)
      } finally {
        loading.value = false
      }
    }

    const handleEdit = (row) => {
      row.editing = true
      row.originalData = { ...row }
    }

    const handleSave = async (row) => {
      try {
        const token = localStorage.getItem('token')
        await axios.put(`/users/${row.id}`, {
          rockets: row.rockets,
          real_name: row.real_name
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        row.editing = false
        ElMessage.success('更新成功')
      } catch (error) {
        ElMessage.error(`更新失败: ${error.response?.data?.message || error.message}`)
        Object.assign(row, row.originalData)
      }
    }

    const handleCancel = (row) => {
      Object.assign(row, row.originalData)
      row.editing = false
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
      fetchUsers()
    })

    return {
      users,
      loading,
      currentPage,
      pageSize,
      total,
      handleEdit,
      handleSave,
      handleCancel,
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

/* 响应式表格样式 */
@media (max-width: 768px) {
  .responsive-table {
    :deep(.el-table__header-wrapper) {
      display: none;
    }

    :deep(.el-table__body-wrapper) {
      td {
        display: block;
        width: 100%;
        border: none;
        padding: 5px 10px;

        &::before {
          content: attr(data-label);
          font-weight: bold;
          display: inline-block;
          width: 100px;
        }
      }

      tr {
        display: block;
        border-bottom: 1px solid #EBEEF5;
        padding: 10px 0;
      }
    }
  }

  .operation-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;

    .el-button {
      margin: 0;
    }
  }
}
</style> 