import { createRouter, createWebHistory } from 'vue-router'

const Placeholder = { template: '<div />' }

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Placeholder },
    { path: '/overview', component: Placeholder },
    { path: '/inputtext', component: Placeholder }
  ]
})

export default router
