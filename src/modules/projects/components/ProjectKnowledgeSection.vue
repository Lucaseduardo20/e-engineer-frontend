<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useProjectsStore } from '@/modules/projects/stores/projects.store'
import { useKnowledgeItemsStore } from '@/modules/knowledge-base/stores/knowledge-items.store'
import { knowledgeTypeLabels, knowledgeStatusLabels } from '@/modules/knowledge-base/types/knowledge.types'
import TechnicalTagSelector from '@/modules/technical-taxonomy/components/TechnicalTagSelector.vue'

const props = defineProps<{ projectId: string }>()

const projectsStore = useProjectsStore()
const knowledgeStore = useKnowledgeItemsStore()
const auth = useAuthStore()

const isLinkOpen = ref(false)
const isPromoteOpen = ref(false)
const relationType = ref('reference_for')
const selectedKnowledgeItemId = ref('')
const confirmRemoveRelationId = ref<string | null>(null)
const promoteForm = ref({
  title: '',
  description: '',
  tags: '',
  tagIds: [] as string[],
  reason: '',
  whenToUse: '',
  warnings: '',
})
const isSavingPromotion = ref(false)
const showPromoteSuccess = ref(false)

const relationTypeOptions = [
  { value: 'reference_for', title: 'Referencia para' },
  { value: 'based_on', title: 'Baseado em' },
  { value: 'model_for', title: 'Modelo para' },
  { value: 'lesson_from', title: 'Licao extraida de' },
  { value: 'standard_for', title: 'Padrao para' },
  { value: 'checklist_for', title: 'Checklist para' },
]

const knowledgeOptions = computed(() =>
  knowledgeStore.items
    .filter((item) => item.status !== 'archived')
    .map((item) => ({
      value: item.id,
      title: item.title,
      subtitle: `${knowledgeTypeLabels[item.type]} · ${knowledgeStatusLabels[item.status]}`,
      deprecated: item.status === 'deprecated',
    })),
)

async function openLinkDialog() {
  isLinkOpen.value = true
  await knowledgeStore.listItems(1, 30)
}

async function linkKnowledge() {
  if (!selectedKnowledgeItemId.value) return

  const success = await projectsStore.linkKnowledgeItem(props.projectId, {
    knowledgeItemId: selectedKnowledgeItemId.value,
    relationType: relationType.value,
  })

  if (success) {
    isLinkOpen.value = false
    selectedKnowledgeItemId.value = ''
    relationType.value = 'reference_for'
  }
}

async function removeRelation() {
  if (!confirmRemoveRelationId.value) return
  const success = await projectsStore.unlinkKnowledgeRelation(
    props.projectId,
    confirmRemoveRelationId.value,
  )
  if (success) {
    confirmRemoveRelationId.value = null
  }
}

async function openPromoteDialog() {
  const project = projectsStore.selectedProject
  promoteForm.value.title = project?.name ?? ''
  promoteForm.value.description = project?.name
    ? `Referencia criada a partir do projeto ${project.name}.`
    : ''
  promoteForm.value.tags = ''
  promoteForm.value.tagIds = []
  promoteForm.value.reason = ''
  promoteForm.value.whenToUse = ''
  promoteForm.value.warnings = ''
  showPromoteSuccess.value = false
  isPromoteOpen.value = true
}

async function promoteProject() {
  if (!promoteForm.value.title.trim() || !promoteForm.value.reason.trim()) return
  isSavingPromotion.value = true
  const created = await projectsStore.promoteProjectToKnowledge(props.projectId, {
    title: promoteForm.value.title.trim(),
    description: promoteForm.value.description.trim() || undefined,
    tagIds: promoteForm.value.tagIds,
    reason: promoteForm.value.reason.trim(),
    whenToUse: promoteForm.value.whenToUse.trim() || undefined,
    warnings: promoteForm.value.warnings.trim() || undefined,
  })
  isSavingPromotion.value = false
  if (created) {
    showPromoteSuccess.value = true
    isPromoteOpen.value = false
  }
}
</script>

<template>
  <v-card class="mt-4" variant="outlined">
    <v-card-title class="d-flex justify-space-between align-center">
      <div>
        <div>Conhecimento aplicado</div>
        <small class="text-medium-emphasis">
          Padroes, referencias, documentos modelo e licoes aprendidas vinculados a este projeto.
        </small>
      </div>
      <v-btn v-if="auth.can('knowledge.link')" color="teal" variant="tonal" @click="openLinkDialog">Vincular conhecimento</v-btn>
      <v-btn v-if="auth.can('knowledge.promote_project')" color="indigo" variant="flat" @click="openPromoteDialog">Promover como referencia</v-btn>
    </v-card-title>

    <v-card-text>
      <v-empty-state v-if="!projectsStore.projectKnowledge.length"
        headline="Nenhum conhecimento aplicado a este projeto"
        text="Vincule padroes, referencias, documentos modelo ou licoes aprendidas para orientar a execucao tecnica e reduzir retrabalho." />
      <v-alert v-if="showPromoteSuccess" type="success" variant="tonal" class="mb-4">
        Projeto promovido para a Base de Conhecimento.
      </v-alert>

      <v-list v-else lines="three">
        <v-list-item v-for="entry in projectsStore.projectKnowledge" :key="entry.relationId"
          :to="`/knowledge-base/${entry.knowledgeItem.id}`">
          <v-list-item-title>{{ entry.knowledgeItem.title }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ knowledgeTypeLabels[entry.knowledgeItem.type as keyof typeof knowledgeTypeLabels] }} ·
            {{ knowledgeStatusLabels[entry.knowledgeItem.status as keyof typeof knowledgeStatusLabels] }} ·
            {{ entry.relationType }}
          </v-list-item-subtitle>
          <template #append>
            <v-btn
              v-if="auth.can('knowledge.unlink')"
              variant="text"
              color="error"
              @click.prevent="confirmRemoveRelationId = entry.relationId"
            >
              Remover
            </v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>

  <v-dialog v-model="isLinkOpen" max-width="720">
    <v-card>
      <v-card-title>Vincular conhecimento</v-card-title>
      <v-card-text>
        <v-select v-model="selectedKnowledgeItemId" :items="knowledgeOptions" item-title="title" item-value="value"
          label="Item da Base de Conhecimento" variant="outlined">
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :subtitle="item.subtitle">
              <template #append>
                <v-chip v-if="item.deprecated" size="x-small" color="warning" variant="tonal">
                  Obsoleto
                </v-chip>
              </template>
            </v-list-item>
          </template>
        </v-select>

        <v-select v-model="relationType" :items="relationTypeOptions" item-title="title" item-value="value"
          label="Tipo de relacao" variant="outlined" class="mt-3" />

        <v-alert v-if="knowledgeOptions.find((item) => item.value === selectedKnowledgeItemId)?.deprecated"
          type="warning" variant="tonal" class="mt-3">
          Este item esta obsoleto e nao e recomendado para novos projetos. Deseja vincula-lo mesmo assim?
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="isLinkOpen = false">Cancelar</v-btn>
        <v-btn color="teal" variant="flat" @click="linkKnowledge">Confirmar vinculo</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="isPromoteOpen" max-width="760">
    <v-card>
      <v-card-title>Promover projeto como referencia</v-card-title>
      <v-card-text>
        <v-text-field v-model="promoteForm.title" label="Titulo da referencia *" variant="outlined" />
        <v-textarea v-model="promoteForm.description" label="Descricao" variant="outlined" rows="2" />
        <TechnicalTagSelector v-model="promoteForm.tagIds" :allow-create="true" :categories="['project_type','technical_discipline','client_context','knowledge_purpose','operational_pain']" />
        <v-textarea v-model="promoteForm.reason" label="Motivo da promocao *" variant="outlined" rows="3" />
        <v-textarea v-model="promoteForm.whenToUse" label="Quando usar esta referencia" variant="outlined" rows="2" />
        <v-textarea v-model="promoteForm.warnings" label="Alertas e observacoes" variant="outlined" rows="2" />
        <v-alert type="info" variant="tonal" class="mt-2">
          O item sera criado como rascunho na Base de Conhecimento.
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="isPromoteOpen = false">Cancelar</v-btn>
        <v-btn
          color="indigo"
          variant="flat"
          :loading="isSavingPromotion"
          :disabled="!promoteForm.title.trim() || !promoteForm.reason.trim()"
          @click="promoteProject"
        >
          Criar referencia
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog
    :model-value="Boolean(confirmRemoveRelationId)"
    @update:model-value="(open) => { if (!open) confirmRemoveRelationId = null }"
    max-width="520"
  >
    <v-card>
      <v-card-title>Remover conhecimento do projeto?</v-card-title>
      <v-card-text>
        O item continuara existindo na Base de Conhecimento, mas deixara de estar vinculado a este projeto.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="confirmRemoveRelationId = null">Cancelar</v-btn>
        <v-btn color="error" variant="flat" @click="removeRelation">Remover vinculo</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
