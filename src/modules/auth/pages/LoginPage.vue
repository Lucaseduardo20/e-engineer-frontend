<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import LoginForm from '@/modules/auth/components/LoginForm.vue'
import { useAuth } from '@/modules/auth/composables/use-auth'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import type { LoginCredentials } from '@/modules/auth/types/auth.types'

const route = useRoute()
const authStore = useAuthStore()
const { error, isLoading, login } = useAuth()

const redirectTo = computed(() => {
  const redirect = route.query.redirect

  return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/dashboard'
})

async function handleLogin(credentials: LoginCredentials) {
  await login(credentials, redirectTo.value)
}

onBeforeUnmount(() => {
  authStore.clearError()
})
</script>

<template>
  <section class="login-page">
    <div class="login-page__context" aria-hidden="true">
      <span class="login-page__brand-mark">EE</span>
      <h1>E-Engineer</h1>
      <p>Controle tecnico para projetos, entregaveis, documentos oficiais e revisoes.</p>

      <dl>
        <div>
          <dt>Rastreabilidade</dt>
          <dd>Versoes oficiais e historico tecnico em um fluxo unico.</dd>
        </div>
        <div>
          <dt>Padronizacao</dt>
          <dd>Templates e referencias para reduzir retrabalho operacional.</dd>
        </div>
      </dl>
    </div>

    <div class="login-page__panel">
      <div class="login-page__header">
        <p>Acesso seguro</p>
        <h2>Entrar na organizacao</h2>
        <span>Use suas credenciais corporativas para acessar o painel tecnico.</span>
      </div>

      <LoginForm :error="error" :loading="isLoading" @submit="handleLogin" />
    </div>
  </section>
</template>

<style scoped>
.login-page {
  display: grid;
  min-height: 100vh;
  grid-template-columns: minmax(0, 1fr) minmax(24rem, 31rem);
}

.login-page__context {
  display: grid;
  align-content: center;
  gap: 1.5rem;
  color: #f6fbf8;
  padding: clamp(2rem, 7vw, 6rem);
}

.login-page__brand-mark {
  display: grid;
  width: 3.25rem;
  height: 3.25rem;
  place-items: center;
  border-radius: 0.5rem;
  background: #d7f2e7;
  color: #143d33;
  font-weight: 900;
}

h1,
h2,
p,
dl,
dd {
  margin: 0;
}

h1 {
  font-size: clamp(2.25rem, 5vw, 4.5rem);
  line-height: 1;
}

.login-page__context > p {
  max-width: 38rem;
  color: #dce8e3;
  font-size: 1.125rem;
  line-height: 1.7;
}

dl {
  display: grid;
  max-width: 42rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

dl > div {
  border: 1px solid rgb(255 255 255 / 0.16);
  border-radius: 0.5rem;
  background: rgb(255 255 255 / 0.07);
  padding: 1rem;
}

dt {
  font-weight: 900;
}

dd {
  margin-top: 0.35rem;
  color: #c9d8d2;
  font-size: 0.875rem;
  line-height: 1.5;
}

.login-page__panel {
  display: grid;
  align-content: center;
  gap: 1.5rem;
  border-left: 1px solid #d9e0e6;
  background: #ffffff;
  padding: clamp(1.5rem, 4vw, 2.5rem);
}

.login-page__header {
  display: grid;
  gap: 0.4rem;
}

.login-page__header p {
  color: #1d6f61;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
}

h2 {
  color: #172033;
  font-size: 1.75rem;
  line-height: 1.15;
}

.login-page__header span {
  color: #667085;
  line-height: 1.55;
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-page__context {
    min-height: 18rem;
  }

  .login-page__panel {
    border-left: 0;
  }
}

@media (max-width: 620px) {
  dl {
    grid-template-columns: 1fr;
  }
}
</style>

