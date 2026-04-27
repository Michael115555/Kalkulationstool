import { createRouter, createWebHistory } from 'vue-router'

import AuswertungenView from '../views/AuswertungenView.vue'
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
    },
    {
      path: '/projekte',
      name: 'projekte',
      component: ProjekteView
    }
  ]
})

export default router
