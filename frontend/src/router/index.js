import { createRouter, createWebHistory } from 'vue-router'

import ProjekteView from '../views/ProjekteView.vue'
import StammdatenView from '../views/StammdatenView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: { name: 'projekte' }
    },
    {
      path: '/projekte',
      name: 'projekte',
      component: ProjekteView
    },
    {
      path: '/stammdaten',
      name: 'stammdaten',
      component: StammdatenView
    }
  ]
})

export default router
