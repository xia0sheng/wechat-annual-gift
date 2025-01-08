<template>
  <div class="program-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>节目列表</span>
          <el-button
            v-if="isAdmin"
            type="primary"
            @click="handleAdd"
          >
            添加节目
          </el-button>
        </div>
      </template>

      <el-table 
        :data="programs" 
        style="width: 100%" 
        v-loading="loading"
        class="responsive-table"
      >
        <el-table-column prop="order_num" label="序号" width="80" />
        <el-table-column prop="name" label="节目名称" />
        <el-table-column prop="performers" label="表演者" />
        <el-table-column prop="total_rockets" label="火箭数量" width="100">
          <template #default="scope">
            {{ scope.row.total_rockets || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="gifters_count" label="赠送人数" width="100">
          <template #default="scope">
            {{ scope.row.gifters_count || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200">
          <template #default="scope">
            <div class="operation-buttons">
              <el-button
                type="primary"
                size="small"
                @click="handleView(scope.row)"
              >
                查看详情
              </el-button>
              <el-button
                type="success"
                size="small"
                @click="handleGift(scope.row)"
              >
                赠送火箭
              </el-button>
              <template v-if="isAdmin">
                <el-button
                  type="warning"
                  size="small"
                  @click="handleEdit(scope.row)"
                >
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleDelete(scope.row)"
                >
                  删除
                </el-button>
              </template>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑/添加对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
    >
      <el-form
        :model="form"
        label-width="100px"
        :rules="rules"
        ref="formRef"
      >
        <el-form-item label="节目名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="表演者" prop="performers">
          <el-input v-model="form.performers" />
        </el-form-item>
        <el-form-item label="节目描述" prop="description">
          <el-input
            type="textarea"
            v-model="form.description"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="显示顺序" prop="order_num">
          <el-input-number v-model="form.order_num" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 赠送火箭对话框 -->
    <el-dialog
      title="赠送火箭"
      v-model="giftDialogVisible"
      width="400px"
    >
      <el-form
        :model="giftForm"
        label-width="100px"
        :rules="giftRules"
        ref="giftFormRef"
      >
        <el-form-item label="火箭数量" prop="rockets">
          <el-input-number
            v-model="giftForm.rockets"
            :min="1"
            :max="userRockets"
          />
        </el-form-item>
        <div class="rockets-info">
          您当前拥有 {{ userRockets }} 个火箭
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="giftDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleGiftSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  setup() {
    const router = useRouter()
    const programs = ref([])
    const loading = ref(false)
    const dialogVisible = ref(false)
    const giftDialogVisible = ref(false)
    const formRef = ref(null)
    const giftFormRef = ref(null)
    const currentId = ref(null)
    const userRockets = ref(0)

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

    const form = ref({
      name: '',
      performers: '',
      description: '',
      order_num: 0
    })

    const giftForm = ref({
      rockets: 1
    })

    const rules = {
      name: [{ required: true, message: '请输入节目名称', trigger: 'blur' }],
      performers: [{ required: true, message: '请输入表演者', trigger: 'blur' }],
      order_num: [{ required: true, message: '请输入显示顺序', trigger: 'blur' }]
    }

    const giftRules = {
      rockets: [{ required: true, message: '请输入火箭数量', trigger: 'blur' }]
    }

    const dialogTitle = computed(() => currentId.value ? '编辑节目' : '添加节目')

    const fetchPrograms = async () => {
      loading.value = true
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('/programs', {
          headers: { Authorization: `Bearer ${token}` }
        })
        programs.value = response.data.data
      } catch (error) {
        ElMessage.error('获取节目列表失败')
        console.error(error)
      } finally {
        loading.value = false
      }
    }

    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        userRockets.value = response.data.data.rockets || 0
      } catch (error) {
        console.error(error)
      }
    }

    const handleAdd = () => {
      currentId.value = null
      form.value = {
        name: '',
        performers: '',
        description: '',
        order_num: 0
      }
      dialogVisible.value = true
    }

    const handleEdit = (row) => {
      currentId.value = row.id
      form.value = { ...row }
      dialogVisible.value = true
    }

    const handleView = (row) => {
      router.push(`/programs/${row.id}`)
    }

    const handleGift = (row) => {
      currentId.value = row.id
      giftForm.value = { rockets: 1 }
      giftDialogVisible.value = true
    }

    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm('确定要删除该节目吗？', '提示', {
          type: 'warning'
        })
        const token = localStorage.getItem('token')
        await axios.delete(`/programs/${row.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        ElMessage.success('删除成功')
        fetchPrograms()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败')
          console.error(error)
        }
      }
    }

    const handleSubmit = async () => {
      if (!formRef.value) return
      await formRef.value.validate(async (valid) => {
        if (valid) {
          try {
            const token = localStorage.getItem('token')
            if (currentId.value) {
              await axios.put(`/programs/${currentId.value}`, form.value, {
                headers: { Authorization: `Bearer ${token}` }
              })
            } else {
              await axios.post('/programs', form.value, {
                headers: { Authorization: `Bearer ${token}` }
              })
            }
            ElMessage.success(currentId.value ? '更新成功' : '添加成功')
            dialogVisible.value = false
            fetchPrograms()
          } catch (error) {
            ElMessage.error(currentId.value ? '更新失败' : '添加失败')
            console.error(error)
          }
        }
      })
    }

    const handleGiftSubmit = async () => {
      if (!giftFormRef.value) return
      await giftFormRef.value.validate(async (valid) => {
        if (valid) {
          try {
            const token = localStorage.getItem('token')
            await axios.post(`/programs/${currentId.value}/gift`, giftForm.value, {
              headers: { Authorization: `Bearer ${token}` }
            })
            ElMessage.success('赠送成功')
            giftDialogVisible.value = false
            fetchPrograms()
            fetchUserInfo()
          } catch (error) {
            ElMessage.error(error.response?.data?.message || '赠送失败')
            console.error(error)
          }
        }
      })
    }

    onMounted(() => {
      fetchPrograms()
      fetchUserInfo()
    })

    return {
      programs,
      loading,
      dialogVisible,
      giftDialogVisible,
      form,
      giftForm,
      formRef,
      giftFormRef,
      rules,
      giftRules,
      dialogTitle,
      isAdmin,
      userRockets,
      handleAdd,
      handleEdit,
      handleView,
      handleGift,
      handleDelete,
      handleSubmit,
      handleGiftSubmit
    }
  }
}
</script>

<style scoped>
.program-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rockets-info {
  text-align: center;
  color: #666;
  margin-top: 10px;
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