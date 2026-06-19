import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'primeicons/primeicons.css'
import './scss/styles.scss'
import './scss/kalkulation-view.scss'
import { appConfig } from './config/appConfig'

document.title = appConfig.displayName
document
  .getElementById('app-initial-cover')
  ?.setAttribute('aria-label', `${appConfig.displayName} wird geladen`)

const app = createApp(App)

app.use(router)
app.mount(document.querySelector('.app-root'))
