<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { apiClient } from '@/shared/http/api-client'
import type { User } from '@/shared/types/api-contracts'

const users = ref<User[]>([])

onMounted(async () => {
  users.value = await apiClient.organizations.users()
})
</script>

<template>
  <v-card class="team-panel" variant="flat" rounded="lg">
    <v-card-title class="team-panel__title">
      <v-icon icon="$success" color="teal" size="19" />
      Equipe
    </v-card-title>
    <v-list lines="two" bg-color="transparent">
      <v-list-item
        v-for="user in users"
        :key="user.id"
        :title="user.fullName"
        :subtitle="user.email"
      >
        <template #prepend>
          <v-avatar color="teal" variant="tonal">{{
            user.fullName.slice(0, 2).toUpperCase()
          }}</v-avatar>
        </template>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<style scoped>
.team-panel {
  border: 1px solid #d7e4df;
  background: #ffffff;
  box-shadow: 0 12px 28px rgb(15 45 38 / 0.06);
}

.team-panel__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid #d8e1de;
  color: #14231f;
  font-size: 1rem;
  font-weight: 850;
}
</style>
