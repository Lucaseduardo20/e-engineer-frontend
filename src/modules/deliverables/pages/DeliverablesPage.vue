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
const formTitle = computed(() => (isEditRoute.value ? 'Editar entregável técnico' : 'Novo entregável técnico'))
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

async function saveDeliverable(payload: CreateDeliverableRequest & { knowledgeItemIds?: string[] }) {
  const { knowledgeItemIds = [], ...deliverablePayload } = payload
  const saved =
    isEditRoute.value && deliverableId.value
      ? await deliverablesStore.updateDeliverable(deliverableId.value, projectId.value, {
          title: deliverablePayload.title,
          description: deliverablePayload.description,
          dueDate: deliverablePayload.dueDate,
          status: deliverablePayload.status,
          type: deliverablePayload.type,
          assignees: deliverablePayload.assignees,
          tagIds: deliverablePayload.tagIds,
        })
      : await deliverablesStore.createDeliverable(deliverablePayload)

  if (saved) {
    await syncDeliverableKnowledge(saved.id, knowledgeItemIds)
    closeForm()
  }
}

async function syncDeliverableKnowledge(deliverableTargetId: string, knowledgeItemIds: string[]) {
  const selected = new Set(knowledgeItemIds)
  const existing = projectsStore.projectKnowledge.filter(
    (entry) => entry.targetType === 'deliverable' && entry.targetId === deliverableTargetId,
  )

  await Promise.all(
    existing
      .filter((entry) => !selected.has(entry.knowledgeItem.id))
      .map((entry) => projectsStore.unlinkKnowledgeRelation(projectId.value, entry.relationId)),
  )

  await Promise.all(
    [...selected]
      .filter((knowledgeItemId) => !existing.some((entry) => entry.knowledgeItem.id === knowledgeItemId))
      .map((knowledgeItemId) =>
        projectsStore.linkKnowledgeItem(projectId.value, {
          knowledgeItemId,
          relationType: 'reference_for',
          deliverableId: deliverableTargetId,
        }),
      ),
  )

  await projectsStore.loadProjectDetail(projectId.value)
}

async function updateDeliverableStatus(deliverable: Deliverable, status: Deliverable['status']) {
  if (deliverable.status === status) {
    return
  }

  await deliverablesStore.updateDeliverable(deliverable.id, projectId.value, { status })
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

    <div class="deliverables-page__content">
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
        @update:item-status="updateDeliverableStatus"
        @update:page="deliverablesStore.loadDeliverables(projectId, $event)"
        @update:status="selectedStatus = $event"
      />
    </div>

    <v-dialog
      :model-value="showForm"
      max-width="820"
      scrollable
      content-class="deliverables-page__dialog"
      @update:model-value="(open) => { if (!open) closeForm() }"
    >
      <v-card class="deliverables-page__modal" style="max-height: calc(100dvh - 2rem);">
        <v-card-title class="deliverables-page__modal-title">
          <div>
            <span>{{ formTitle }}</span>
            <small>Organize prazo, responsável e tipo técnico sem sair do cockpit.</small>
          </div>
          <v-btn icon="$close" variant="text" aria-label="Fechar" @click="closeForm" />
        </v-card-title>
        <v-card-text class="deliverables-page__modal-body">
          <DeliverableForm
            :project-id="projectId"
            :deliverable="isEditRoute ? deliverablesStore.selectedDeliverable : null"
            :knowledge-items="projectsStore.projectKnowledge"
            :loading="deliverablesStore.isSaving"
            @submit="saveDeliverable"
            @cancel="closeForm"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
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

.deliverables-page__modal {
  overflow: hidden;
  border: 1px solid #b9ddd2;
  background: #f4faf7;
}

.deliverables-page__modal-title {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  background:
    linear-gradient(135deg, #10231f, #143d33 56%, #267365),
    #10231f;
  padding: 1rem 1.25rem;
}

.deliverables-page__modal-title > div {
  display: grid;
}

.deliverables-page__modal-title span {
  color: #ffffff;
  font-weight: 850;
}

.deliverables-page__modal-title small {
  color: #d7f2e7;
}

.deliverables-page__modal-title :deep(.v-btn) {
  color: #ffffff;
}

.deliverables-page__modal-body {
  overflow-y: auto;
  padding: 1rem;
  scrollbar-color: #8ccbbd #eef7f3;
  scrollbar-width: thin;
}
</style>
