import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/pages/Home.vue') },
  { path: '/browse', name: 'browse', component: () => import('@/pages/Browse.vue') },
  { path: '/quiz', name: 'quiz', component: () => import('@/pages/Quiz.vue') }
]

const router = createRouter({ history: createWebHashHistory(), routes })
export default router
