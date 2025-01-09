import { createRouter, createWebHistory } from 'vue-router'
import UserList from './views/UserList.vue'
import Login from './views/Login.vue'
import ProgramList from './views/ProgramList.vue'
import ProgramDetail from './views/ProgramDetail.vue'
import AdminToken from './views/AdminToken.vue'

const routes = [
  {
    path: '/',
    redirect: to => {
      const token = localStorage.getItem('token');
      if (!token) return '/login';
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        return decoded.role === 'admin' ? '/programs' : '/programs';
      } catch (e) {
        return '/login';
      }
    }
  },
  {
    path: '/login',
    component: Login
  },
  {
    path: '/users',
    component: UserList,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/profile',
    component: () => import('./views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/programs',
    component: ProgramList,
    meta: { requiresAuth: true }
  },
  {
    path: '/programs/:id',
    component: ProgramDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin-token',
    component: AdminToken,
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes
})

router.beforeEach((to, from, next) => {
  // 检查 URL 中是否有 token
  const urlParams = new URLSearchParams(window.location.search)
  const urlToken = urlParams.get('token')
  
  if (urlToken) {
    localStorage.setItem('token', urlToken)
    // 使用 replace 清除 URL 中的 token
    const newUrl = window.location.pathname + window.location.hash
    window.history.replaceState({}, document.title, newUrl)
    // 不直接跳转，而是刷新页面以确保状态正确更新
    window.location.replace('/admin/#/programs')
    return
  }

  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }

  if (to.meta.requiresAdmin && token) {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]))
      if (decoded.role !== 'admin') {
        next('/profile')
        return
      }
    } catch (e) {
      next('/login')
      return
    }
  }

  next()
})

export default router 