<template>
  <div class="program-list">
    <div class="header">
      <h2>节目列表</h2>
      <el-button 
        v-if="isAdmin"
        type="primary" 
        @click="handleAdd"
      >
        <i class="el-icon-plus"></i> 添加节目
      </el-button>
    </div>

    <!-- 网格布局 -->
    <div class="program-grid">
      <el-card 
        v-for="program in programs" 
        :key="program.id" 
        class="program-card"
        shadow="hover"
      >
        <!-- 节目信息 -->
        <div class="program-info">
          <div class="program-header">
            <div class="program-name">{{ program.name }}</div>
            <div class="program-order">#{{ program.order_num }}</div>
          </div>
          <div class="program-performers">
            <i class="el-icon-user-solid"></i>
            {{ program.performers }}
          </div>
          <div class="program-stats">
            <div class="stat-item">
              <i class="el-icon-present"></i>
              <span>{{ program.total_rockets }} 个火箭</span>
            </div>
            <div class="stat-item">
              <i class="el-icon-user"></i>
              <span>{{ program.gifters_count }} 位观众</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="card-actions">
          <!-- 所有用户都能看到的操作 -->
          <div class="user-actions">
            <el-button 
              type="warning" 
              class="gift-btn"
              @click.stop="handleGift(program)"
              :disabled="!userRockets"
            >
              <i class="el-icon-present"></i>
              赠送火箭 {{ userRockets ? `(${userRockets}个可用)` : '(暂无可用)' }}
            </el-button>
            <el-button 
              type="info" 
              plain
              @click.stop="handleCardClick(program)"
            >
              查看详情
            </el-button>
          </div>

          <!-- 管理员才能看到的操作 -->
          <template v-if="isAdmin">
            <el-divider content-position="center">管理操作</el-divider>
            <div class="admin-actions">
              <el-button 
                type="primary"
                size="small"
                @click.stop="handleEdit(program)"
              >
                <i class="el-icon-edit"></i> 编辑
              </el-button>
              <el-button 
                type="danger"
                size="small"
                @click.stop="handleDelete(program)"
              >
                <i class="el-icon-delete"></i> 删除
              </el-button>
            </div>
          </template>
        </div>
      </el-card>
    </div>

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
      :close-on-click-modal="false"
    >
      <el-form
        :model="giftForm"
        label-width="100px"
        :rules="giftRules"
        ref="giftFormRef"
      >
        <el-form-item label="节目名称">
          <span>{{ programs.find(p => p.id === currentId)?.name }}</span>
        </el-form-item>
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
          <el-button 
            type="primary" 
            @click="handleGiftSubmit"
            :disabled="!userRockets"
          >
            确定赠送
          </el-button>
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
    const loading = ref(true)
    const dialogVisible = ref(false)
    const giftDialogVisible = ref(false)
    const formRef = ref(null)
    const giftFormRef = ref(null)
    const currentId = ref(null)
    const userRockets = ref(0)
    const isAdmin = ref(false)

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
        console.log('Token:', token); // 调试用

        const response = await axios.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        console.log('User info response:', response.data); // 调试用

        userRockets.value = response.data.data.rockets || 0
        isAdmin.value = response.data.data.role === 'admin'
        console.log('Is admin:', isAdmin.value); // 调试用
        
        localStorage.setItem('userRole', response.data.data.role)
      } catch (error) {
        console.error('Fetch user info error:', error)
        if (error.response) {
          console.error('Error response:', error.response.data)
        }
      }
    }

    const handleCardClick = (program) => {
      router.push(`/programs/${program.id}`)
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

    const handleEdit = (program) => {
      currentId.value = program.id
      form.value = {
        name: program.name,
        performers: program.performers,
        description: program.description,
        order_num: program.order_num
      }
      dialogVisible.value = true
    }

    const handleDelete = (program) => {
      ElMessageBox.confirm(
        `确定要删除节目"${program.name}"吗？`,
        '警告',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const token = localStorage.getItem('token')
          await axios.delete(`/programs/${program.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          ElMessage.success('删除成功')
          fetchPrograms()
        } catch (error) {
          ElMessage.error(error.response?.data?.message || '删除失败')
          console.error(error)
        }
      }).catch(() => {})
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

    // 处理赠送火箭
    const handleGift = (program) => {
      currentId.value = program.id
      giftForm.value = { rockets: 1 }
      giftDialogVisible.value = true
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
      handleCardClick,
      handleAdd,
      handleEdit,
      handleDelete,
      handleSubmit,
      handleGiftSubmit,
      handleGift
    }
  }
}
</script>

<style scoped>
.program-list {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.program-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 10px;
}

.program-card {
  cursor: default;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.program-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.program-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.program-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.program-order {
  font-size: 14px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 12px;
}

.program-name {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  flex: 1;
  margin-right: 10px;
}

.program-performers {
  font-size: 14px;
  color: #606266;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.program-stats {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
}

.stat-item i {
  font-size: 16px;
  color: #409EFF;
}

.card-actions {
  margin-top: auto;
  padding-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gift-btn {
  background-color: #e6a23c;
  border-color: #e6a23c;
  color: white;
}

.gift-btn:hover:not(:disabled) {
  background-color: #ebb563;
  border-color: #ebb563;
}

.gift-btn:disabled {
  cursor: not-allowed;
  background-color: #f3d19e;
  border-color: #f3d19e;
}

.admin-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .program-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 15px;
    padding: 10px;
  }

  .program-name {
    font-size: 16px;
  }

  .program-performers {
    font-size: 13px;
  }

  .program-stats {
    font-size: 13px;
  }

  .admin-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .admin-actions .el-button {
    flex: 1;
  }
}

.rockets-info {
  text-align: center;
  color: #666;
  margin-top: 10px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}
</style> 