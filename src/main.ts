import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './app/styles/global.css'
import 'vuetify/dist/vuetify.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { configureUnauthorizedHandler } from './shared/http/http-client'
import { useAuthStore } from './modules/auth/stores/auth.store'

const app = createApp(App)
const pinia = createPinia()

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'eEngineerLight',
    themes: {
      eEngineerLight: {
        dark: false,
        colors: {
          background: '#f4f7f6',
          surface: '#ffffff',
          primary: '#123c32',
          secondary: '#2447a8',
          accent: '#b7791f',
          error: '#b42318',
          info: '#2563eb',
          success: '#1d7f5f',
          warning: '#b7791f',
        },
      },
    },
  },
})

app.use(pinia)
app.use(router)
app.use(vuetify)

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
