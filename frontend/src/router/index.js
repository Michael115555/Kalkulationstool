import { createRouter, createWebHistory } from 'vue-router'

import KalkulationView from '../views/KalkulationView.vue'
import ProjekteView from '../views/ProjekteView.vue'
import StammdatenView from '../views/StammdatenView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'kalkulation',
      component: KalkulationView
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
