import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './app/styles/global.css'
import { configureUnauthorizedHandler } from './shared/http/http-client'
import { useAuthStore } from './modules/auth/stores/auth.store'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

configureUnauthorizedHandler(() => {
  const authStore = useAuthStore(pinia)
  authStore.logout()

  if (router.currentRoute.value.path !== '/login') {
    void router.push({
      path: '/login',
      query: {
        redirect: router.currentRoute.value.fullPath,
      },
    })
  }
})

app.mount('#app')
