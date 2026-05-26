<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'

const authStore = useAuthStore()

onMounted(() => {
  authStore.logout()
})
</script>

<template>
  <section class="logout-page">
    <div class="logout-page__panel">
      <span class="logout-page__mark">EE</span>
      <h1>Sessao encerrada</h1>
      <p>Seu acesso ao painel tecnico foi finalizado com seguranca.</p>
      <RouterLink class="logout-page__link" to="/login">Voltar para login</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.logout-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  background:
    linear-gradient(90deg, rgb(16 35 31 / 0.96), rgb(16 35 31 / 0.78)),
    #f3f5f4;
  padding: 1rem;
}

.logout-page__panel {
  display: grid;
  width: min(100%, 28rem);
  justify-items: center;
  gap: 0.875rem;
  border-radius: 0.5rem;
  background: #ffffff;
  padding: 2rem;
  text-align: center;
}

.logout-page__mark {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: 0.5rem;
  background: #d7f2e7;
  color: #143d33;
  font-weight: 900;
}

h1,
p {
  margin: 0;
}

h1 {
  color: #172033;
  font-size: 1.5rem;
}

p {
  color: #667085;
  line-height: 1.55;
}

.logout-page__link {
  display: inline-flex;
  min-height: 2.625rem;
  align-items: center;
  border-radius: 0.5rem;
  background: #1d6f61;
  color: #ffffff;
  font-weight: 900;
  padding: 0 1rem;
  text-decoration: none;
}
</style>

