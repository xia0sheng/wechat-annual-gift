import { createRouter, createWebHistory } from 'vue-router'
import UserList from './views/UserList.vue'
import Login from './views/Login.vue'

const routes = [
  {
    path: '/',
    redirect: '/users'
  },
  {
    path: '/login',
    component: Login
  },
  {
    path: '/users',
    component: UserList,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes
})

router.beforeEach((to, from, next) => {
  // 检查 URL 中是否有 token
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (token) {
      localStorage.setItem('token', token);
      // 清除 URL 中的 token
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
  }

  const hasToken = !!localStorage.getItem('token')
  if (to.meta.requiresAuth && !hasToken) {
      next('/login')
  } else {
      next()
  }
})

export default router 