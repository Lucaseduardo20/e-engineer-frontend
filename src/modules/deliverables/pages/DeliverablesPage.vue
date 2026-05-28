<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DeliverableForm from '@/modules/deliverables/components/DeliverableForm.vue'
import DeliverablesList from '@/modules/deliverables/components/DeliverablesList.vue'
import { useDeliverablesStore } from '@/modules/deliverables/stores/deliverables.store'
import { useProjectsStore } from '@/modules/projects/stores/projects.store'
import BasePageHeader from '@/shared/components/BasePageHeader.vue'
import type { CreateDeliverableRequest } from '@/shared/http/api-client'
import type { Deliverable } from '@/shared/types/api-contracts'

const route = useRoute()
const router = useRouter()
const deliverablesStore = useDeliverablesStore()
const projectsStore = useProjectsStore()

const projectId = computed(() => String(route.params.projectId))
const deliverableId = computed(() =>
  route.params.deliverableId ? String(route.params.deliverableId) : null,
)
const isCreateRoute = computed(() => route.name === 'deliverable-create')
const isEditRoute = computed(() => route.name === 'deliverable-edit')
const showForm = computed(() => isCreateRoute.value || isEditRoute.value)
const pageTitle = computed(() => projectsStore.selectedProject?.name ?? 'Entregaveis')
const selectedStatus = computed({
  get: () => deliverablesStore.filters.status ?? null,
  set: (status: Deliverable['status'] | null) => {
    void deliverablesStore.loadDeliverables(projectId.value, 1, {
      status: status ?? undefined,
    })
  },
})

onMounted(() => {
  void loadPage()
})

watch(
  () => route.fullPath,
  () => {
    void loadPage()
  },
)

async function loadPage() {
  deliverablesStore.clearSelected()
  await Promise.all([
    projectsStore.loadProjectDetail(projectId.value),
    deliverablesStore.loadDeliverables(projectId.value),
    deliverablesStore.loadUsers(),
  ])

  if (isEditRoute.value && deliverableId.value) {
    await deliverablesStore.loadDeliverable(deliverableId.value)
  }
}

function goToCreate() {
  void router.push(`/projects/${projectId.value}/deliverables/new`)
}

function goToEdit(deliverable: Deliverable) {
  void router.push(`/projects/${projectId.value}/deliverables/${deliverable.id}/edit`)
}

function closeForm() {
  void router.push(`/projects/${projectId.value}/deliverables`)
}

async function saveDeliverable(payload: CreateDeliverableRequest) {
  const saved =
    isEditRoute.value && deliverableId.value
      ? await deliverablesStore.updateDeliverable(deliverableId.value, projectId.value, {
          title: payload.title,
          description: payload.description,
          dueDate: payload.dueDate,
          status: payload.status,
          type: payload.type,
          assignees: payload.assignees,
        })
      : await deliverablesStore.createDeliverable(payload)

  if (saved) {
    closeForm()
  }
}
</script>

<template>
  <v-container fluid class="deliverables-page pa-0">
    <BasePageHeader
      eyebrow="Controle tecnico"
      :title="pageTitle"
      description="Acompanhe entregaveis por tipo, prazo, status e responsaveis tecnicos."
      :breadcrumbs="['Projetos', 'Entregaveis']"
    >
      <template #actions>
        <v-btn :to="`/projects/${projectId}`" variant="outlined">Voltar ao projeto</v-btn>
        <v-btn color="teal" prepend-icon="$plus" @click="goToCreate">Novo entregavel</v-btn>
      </template>
    </BasePageHeader>

    <v-alert v-if="deliverablesStore.error" type="error" variant="tonal">
      {{ deliverablesStore.error }}
    </v-alert>

    <div
      class="deliverables-page__content"
      :class="{ 'deliverables-page__content--form': showForm }"
    >
      <DeliverableForm
        v-if="showForm"
        :project-id="projectId"
        :deliverable="isEditRoute ? deliverablesStore.selectedDeliverable : null"
        :loading="deliverablesStore.isSaving"
        @submit="saveDeliverable"
        @cancel="closeForm"
      />

      <DeliverablesList
        :deliverables="deliverablesStore.deliverables"
        :loading="deliverablesStore.isLoading"
        :page="deliverablesStore.page"
        :page-size="deliverablesStore.pageSize"
        :total="deliverablesStore.total"
        :status="selectedStatus"
        :users="deliverablesStore.users"
        @create="goToCreate"
        @edit="goToEdit"
        @update:page="deliverablesStore.loadDeliverables(projectId, $event)"
        @update:status="selectedStatus = $event"
      />
    </div>
  </v-container>
</template>

<style scoped>
.deliverables-page {
  display: grid;
  gap: 1rem;
}

.deliverables-page__content {
  display: grid;
  gap: 1rem;
}

.deliverables-page__content--form {
  grid-template-columns: minmax(20rem, 0.42fr) minmax(0, 1fr);
  align-items: start;
}

@media (max-width: 1100px) {
  .deliverables-page__content--form {
    grid-template-columns: 1fr;
  }
}
</style>
