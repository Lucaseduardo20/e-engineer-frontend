<script setup lang="ts">
import { computed, onMounted } from 'vue'
import BasePageHeader from '@/shared/components/BasePageHeader.vue'
import { useOrganizationsStore } from '@/modules/organizations/stores/organizations.store'

const organizationsStore = useOrganizationsStore()

const organizationInitials = computed(() => {
  const name = organizationsStore.currentOrganization?.name ?? 'E Engineer'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
})

const roleSummary = computed(() =>
  organizationsStore.users.reduce<Record<string, number>>((summary, user) => {
    const role = user.roles[0] ?? 'member'
    summary[role] = (summary[role] ?? 0) + 1
    return summary
  }, {}),
)

onMounted(() => {
  void organizationsStore.loadOverview()
})

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    owner: 'Proprietario',
    admin: 'Admin',
    manager: 'Gestor',
    member: 'Membro',
  }

  return labels[role] ?? role
}
</script>

<template>
  <v-container fluid class="organizations-page pa-0">
    <BasePageHeader
      eyebrow="Administracao"
      title="Organizacao"
      description="Acompanhe a organizacao autenticada, os usuarios vinculados e a distribuicao de papeis tecnicos."
      :breadcrumbs="['Dashboard', 'Organizacao']"
    />

    <v-alert v-if="organizationsStore.error" type="error" variant="tonal">
      {{ organizationsStore.error }}
    </v-alert>

    <v-progress-linear
      v-if="organizationsStore.isLoading"
      indeterminate
      color="teal"
      rounded
      class="organizations-page__loading"
    />

    <section class="organizations-page__overview">
      <v-sheet class="organizations-page__identity" border rounded="lg">
        <v-avatar color="teal" variant="tonal" size="56">{{ organizationInitials }}</v-avatar>
        <div>
          <p class="organizations-page__eyebrow">Tenant ativo</p>
          <h2>{{ organizationsStore.currentOrganization?.name ?? 'Organizacao' }}</h2>
          <p>{{ organizationsStore.currentOrganization?.slug ?? 'sem-slug' }}</p>
        </div>
      </v-sheet>

      <v-sheet class="organizations-page__metric" border rounded="lg">
        <span>Total de usuarios</span>
        <strong>{{ organizationsStore.users.length }}</strong>
      </v-sheet>

      <v-sheet class="organizations-page__metric" border rounded="lg">
        <span>Administracao</span>
        <strong>{{ organizationsStore.ownerUsers.length }}</strong>
      </v-sheet>

      <v-sheet class="organizations-page__metric" border rounded="lg">
        <span>Equipe tecnica</span>
        <strong>{{ organizationsStore.technicalUsers.length }}</strong>
      </v-sheet>
    </section>

    <section class="organizations-page__content">
      <v-sheet class="organizations-page__panel" border rounded="lg">
        <div class="organizations-page__panel-header">
          <div>
            <p class="organizations-page__eyebrow">Equipe</p>
            <h2>Usuarios vinculados</h2>
          </div>
          <v-chip color="teal" variant="tonal">{{ organizationsStore.users.length }}</v-chip>
        </div>

        <div class="organizations-page__table-wrap">
          <table class="organizations-page__table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Papel</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in organizationsStore.users" :key="user.id">
                <td>
                  <div class="organizations-page__user">
                    <v-avatar color="teal" variant="tonal" size="32">
                      {{ user.fullName.slice(0, 1).toUpperCase() }}
                    </v-avatar>
                    <span>{{ user.fullName }}</span>
                  </div>
                </td>
                <td>{{ user.email }}</td>
                <td>
                  <v-chip color="teal" variant="tonal" size="small">
                    {{ roleLabel(user.roles[0] ?? 'member') }}
                  </v-chip>
                </td>
              </tr>
              <tr v-if="!organizationsStore.isLoading && organizationsStore.users.length === 0">
                <td colspan="3" class="organizations-page__empty">
                  Nenhum usuario vinculado.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-sheet>

      <v-sheet class="organizations-page__panel" border rounded="lg">
        <div class="organizations-page__panel-header">
          <div>
            <p class="organizations-page__eyebrow">Papeis</p>
            <h2>Distribuicao</h2>
          </div>
        </div>

        <div class="organizations-page__roles">
          <div
            v-for="(count, role) in roleSummary"
            :key="role"
            class="organizations-page__role-row"
          >
            <span>{{ roleLabel(role) }}</span>
            <strong>{{ count }}</strong>
          </div>
          <p v-if="Object.keys(roleSummary).length === 0" class="organizations-page__empty">
            Sem papeis registrados.
          </p>
        </div>
      </v-sheet>
    </section>
  </v-container>
</template>

<style scoped>
.organizations-page {
  display: grid;
  gap: 1.25rem;
}

.organizations-page__loading {
  margin-top: -0.25rem;
}

.organizations-page__overview,
.organizations-page__content {
  display: grid;
  gap: 1rem;
}

.organizations-page__overview {
  grid-template-columns: minmax(18rem, 1.7fr) repeat(3, minmax(10rem, 1fr));
}

.organizations-page__content {
  grid-template-columns: minmax(0, 2fr) minmax(18rem, 0.8fr);
  align-items: start;
}

.organizations-page__identity,
.organizations-page__metric,
.organizations-page__panel {
  background: #ffffff;
  border-color: #d7e4df;
}

.organizations-page__identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.organizations-page__identity h2,
.organizations-page__panel h2 {
  margin: 0;
  color: #123c32;
  font-size: 1.05rem;
  line-height: 1.25;
}

.organizations-page__identity p {
  margin: 0.25rem 0 0;
  color: #667085;
  overflow-wrap: anywhere;
}

.organizations-page__eyebrow {
  margin: 0 0 0.35rem;
  color: #1d6f61;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.organizations-page__metric {
  display: grid;
  gap: 0.5rem;
  padding: 1rem;
}

.organizations-page__metric span {
  color: #667085;
  font-size: 0.875rem;
}

.organizations-page__metric strong {
  color: #123c32;
  font-size: 2rem;
  line-height: 1;
}

.organizations-page__panel {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.organizations-page__panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.organizations-page__table-wrap {
  overflow-x: auto;
}

.organizations-page__table {
  width: 100%;
  min-width: 42rem;
  border-collapse: collapse;
}

.organizations-page__table th,
.organizations-page__table td {
  padding: 0.85rem;
  border-top: 1px solid #e3ece8;
  color: #344054;
  text-align: left;
  vertical-align: middle;
}

.organizations-page__table th {
  color: #667085;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.organizations-page__user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #123c32;
  font-weight: 650;
}

.organizations-page__roles {
  display: grid;
  gap: 0.75rem;
}

.organizations-page__role-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem;
  border: 1px solid #e3ece8;
  border-radius: 0.5rem;
  color: #344054;
}

.organizations-page__role-row strong {
  color: #123c32;
}

.organizations-page__empty {
  color: #667085;
  text-align: center;
}

@media (max-width: 1080px) {
  .organizations-page__overview,
  .organizations-page__content {
    grid-template-columns: 1fr;
  }
}
</style>
