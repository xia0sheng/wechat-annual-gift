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
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router 