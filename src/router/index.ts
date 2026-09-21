import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('../views/Home.vue')
    },
    {
        path: '/materi',
        name: 'materi',
        component: () => import('../views/Materi.vue')
    },
    {
        path: '/kuis',
        name: 'kuis',
        component: () => import('../views/Home.vue')
    },
    {
        path: '/profil',
        name: 'profil',
        component: () => import('../views/Home.vue')
    }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0, behavior: "smooth" };
    }
  },
});

export default router