<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AuthenticatedLayout from '@/app/layouts/AuthenticatedLayout.vue'
import UnauthenticatedLayout from '@/app/layouts/UnauthenticatedLayout.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'

const route = useRoute()
const authStore = useAuthStore()

const isProtectedRoute = computed(() => Boolean(route.meta.requiresAuth))

onMounted(() => {
  authStore.restoreSession()
})
</script>

<template>
  <AuthenticatedLayout v-if="isProtectedRoute">
    <RouterView />
  </AuthenticatedLayout>

  <UnauthenticatedLayout v-else>
    <RouterView />
  </UnauthenticatedLayout>
</template>
