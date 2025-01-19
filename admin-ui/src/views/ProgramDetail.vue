<template>
  <div class="program-detail">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button @click="$router.back()" icon="el-icon-back">返回</el-button>
            <span class="title">节目详情</span>
          </div>
          <div class="header-right">
            <el-button
              type="success"
              @click="handleGift"
            >
              赠送火箭
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="program" class="program-info">
        <!-- Debug info -->
        <pre v-if="isAdmin" style="font-size: 12px; background: #f5f5f5; padding: 10px; margin-bottom: 20px;">
          {{ JSON.stringify(program, null, 2) }}
        </pre>
        <div class="info-section">
          <h3>基本信息</h3>
          <div class="info-item">
            <label>节目名称：</label>
            <span>{{ program.name || '-' }}</span>
          </div>
          <div class="info-item">
            <label>表演者：</label>
            <span>{{ program.performers || '-' }}</span>
          </div>
          <div class="info-item">
            <label>节目描述：</label>
            <span>{{ program.description || '暂无描述' }}</span>
          </div>
          <div class="info-item">
            <label>显示顺序：</label>
            <span>{{ program.order_num || 0 }}</span>
          </div>
          <div class="info-item">
            <label>收到火箭：</label>
            <span>{{ program.total_rockets || 0 }}</span>
          </div>
          <div class="info-item">
            <label>赠送人数：</label>
            <span>{{ program.gifters_count || 0 }}</span>
          </div>
        </div>

        <div class="gifts-section">
          <h3>火箭赠送记录</h3>
          <el-table :data="program.gifts" style="width: 100%">
            <el-table-column label="赠送者" width="200">
              <template #default="scope">
                <div class="user-info">
                  <el-avatar :size="30" :src="scope.row.headimgurl" />
                  <span>{{ scope.row.real_name || scope.row.nickname }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="rockets" label="火箭数量" width="100" />
            <el-table-column label="赠送时间" min-width="180">
              <template #default="scope">
                {{ formatDate(scope.row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页控件 -->
          <div class="pagination-container">
            <el-pagination
              v-if="program.gifts_pagination"
              :current-page="currentPage"
              :page-size="pageSize"
              :total="program.gifts_pagination.total"
              layout="total, prev, pager, next"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </div>
    </el-card>

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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

export default {
  setup() {
    const route = useRoute()
    const router = useRouter()
    const program = ref(null)
    const loading = ref(true)
    const giftDialogVisible = ref(false)
    const giftFormRef = ref(null)
    const userRockets = ref(0)
    const currentPage = ref(1)
    const pageSize = ref(10)

    const giftForm = ref({
      rockets: 1
    })

    const giftRules = {
      rockets: [{ required: true, message: '请输入火箭数量', trigger: 'blur' }]
    }

    const fetchProgram = async () => {
      loading.value = true
      try {
        const token = localStorage.getItem('token')
        console.log('Fetching program with ID:', route.params.id)
        const response = await axios.get(`/programs/${route.params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            page: currentPage.value,
            page_size: pageSize.value
          }
        })
        console.log('Program response:', response.data)
        if (!response.data.success) {
          console.error('API response indicates failure');
          ElMessage.error('获取节目信息失败');
          return;
        }
        if (!response.data.data) {
          console.error('No data in API response');
          ElMessage.error('节目数据为空');
          return;
        }

        const rawData = response.data.data;
        console.log('Raw program data:', rawData);

        program.value = {
          id: rawData.id,
          name: rawData.name || '',
          description: rawData.description || '',
          performers: rawData.performers || '',
          order_num: rawData.order_num || 0,
          total_rockets: parseInt(rawData.total_rockets) || 0,
          gifters_count: parseInt(rawData.gifters_count) || 0,
          created_at: rawData.created_at,
          updated_at: rawData.updated_at,
          gifts: (rawData.gifts || []).map(gift => ({
            id: gift.id,
            user_id: gift.user_id,
            rockets: parseInt(gift.rockets) || 0,
            created_at: gift.created_at,
            nickname: gift.nickname || '',
            headimgurl: gift.headimgurl || '',
            real_name: gift.real_name || '',
            gifts_pagination: rawData.gifts_pagination || {}
          })),
          gifts_pagination: rawData.gifts_pagination || {}
        }
        console.log('Processed program data:', program.value)
      } catch (error) {
        ElMessage.error(`获取节目信息失败: ${error.response?.data?.message || error.message}`)
        console.error('Program fetch error:', error.response?.data || error)
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

    const handleGift = () => {
      giftForm.value = { rockets: 1 }
      giftDialogVisible.value = true
    }

    const handleGiftSubmit = async () => {
      if (!giftFormRef.value) return
      await giftFormRef.value.validate(async (valid) => {
        if (valid) {
          try {
            const token = localStorage.getItem('token')
            await axios.post(`/programs/${route.params.id}/gift`, giftForm.value, {
              headers: { Authorization: `Bearer ${token}` }
            })
            ElMessage.success('赠送成功')
            giftDialogVisible.value = false
            fetchProgram()
            fetchUserInfo()
          } catch (error) {
            ElMessage.error(error.response?.data?.message || '赠送失败')
            console.error(error)
          }
        }
      })
    }

    const formatDate = (date) => {
      if (!date) return '-'
      try {
        return new Date(date).toLocaleString('zh-CN', {
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

    const handlePageChange = (page) => {
      currentPage.value = page
      fetchProgram()
    }

    onMounted(() => {
      fetchProgram()
      fetchUserInfo()
    })

    return {
      program,
      loading,
      giftDialogVisible,
      giftForm,
      giftFormRef,
      giftRules,
      userRockets,
      currentPage,
      pageSize,
      handleGift,
      handleGiftSubmit,
      formatDate,
      handlePageChange
    }
  }
}
</script>

<style scoped>
.program-detail {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.program-info {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.info-section, .gifts-section {
  margin-bottom: 20px;
}

.info-section h3, .gifts-section h3 {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.info-item {
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
}

.info-item label {
  font-weight: bold;
  width: 100px;
  margin-right: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rockets-info {
  text-align: center;
  color: #666;
  margin-top: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style> 