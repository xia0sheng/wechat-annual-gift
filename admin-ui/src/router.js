import { createRouter, createWebHistory } from 'vue-router'
import UserList from './views/UserList.vue'
import Login from './views/Login.vue'

const routes = [
  {
    path: '/',
    redirect: to => {
      const token = localStorage.getItem('token');
      if (!token) return '/login';
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        return decoded.role === 'admin' ? '/users' : '/profile';
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
  }
]

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.meta.requiresAuth && !token) {
    next('/login');
    return;
  }

  if (to.meta.requiresAdmin && token) {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (decoded.role !== 'admin') {
        next('/profile');
        return;
      }
    } catch (e) {
      next('/login');
      return;
    }
  }

  next();
})

export default router 