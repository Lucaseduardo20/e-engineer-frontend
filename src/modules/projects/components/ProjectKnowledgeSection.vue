<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useProjectsStore } from '@/modules/projects/stores/projects.store'
import { useKnowledgeItemsStore } from '@/modules/knowledge-base/stores/knowledge-items.store'
import { apiClient } from '@/shared/http/api-client'
import type { Deliverable } from '@/shared/types/api-contracts'
import type { TechnicalTag } from '@/shared/types/api-contracts'
import {
  knowledgeStatusLabels,
  knowledgeTypeLabels,
  type KnowledgeItemType,
} from '@/modules/knowledge-base/types/knowledge.types'
import TechnicalTagSelector from '@/modules/technical-taxonomy/components/TechnicalTagSelector.vue'

const props = defineProps<{
  projectId: string
  deliverables: Deliverable[]
}>()

const projectsStore = useProjectsStore()
const knowledgeStore = useKnowledgeItemsStore()
const auth = useAuthStore()

const isManagementOpen = ref(false)
const activePanel = ref('overview')
const promoteStep = ref(1)
const relationType = ref('reference_for')
const selectedKnowledgeItemId = ref('')
const targetScope = ref<'project' | 'deliverable'>('project')
const selectedDeliverableId = ref('')
const confirmRemoveRelationId = ref<string | null>(null)
const suggestedTechnicalTags = ref<TechnicalTag[]>([])
const isLoadingSuggestedTags = ref(false)
const promoteForm = ref({
  title: '',
  description: '',
  tagIds: [] as string[],
  reason: '',
  whenToUse: '',
  warnings: '',
})
const isSavingPromotion = ref(false)
const showPromoteSuccess = ref(false)

const relationTypeOptions = [
  { value: 'reference_for', title: 'Referencia para orientar o projeto' },
  { value: 'based_on', title: 'Base tecnica utilizada' },
  { value: 'model_for', title: 'Modelo para entrega/documento' },
  { value: 'lesson_from', title: 'Licao aprendida aplicavel' },
  { value: 'standard_for', title: 'Padrao tecnico recomendado' },
  { value: 'checklist_for', title: 'Checklist de revisao' },
]
const deliverableTypeLabels: Record<string, string> = {
  technical_survey: 'levantamento tecnico',
  architectural_project: 'projeto arquitetonico',
  structural_project: 'projeto estrutural',
  electrical_project: 'projeto eletrico',
  hydraulic_project: 'projeto hidraulico',
  drainage_project: 'drenagem',
  paving_project: 'pavimentacao',
  landscaping_project: 'paisagismo',
  lighting_project: 'iluminacao',
  descriptive_memorial: 'memorial descritivo',
  budget: 'orcamento',
  schedule: 'cronograma',
  art_rrt: 'art rrt',
  photographic_report: 'relatorio fotografico',
  technical_report: 'relatorio tecnico',
  other: 'entregavel tecnico',
}

const appliedKnowledge = computed(() => projectsStore.projectKnowledge)
const appliedCount = computed(() => appliedKnowledge.value.length)
const deprecatedCount = computed(
  () => appliedKnowledge.value.filter((entry) => entry.knowledgeItem.status === 'deprecated').length,
)
const appliedByType = computed(() =>
  appliedKnowledge.value.reduce<Record<string, number>>((summary, entry) => {
    const type = entry.knowledgeItem.type
    summary[type] = (summary[type] ?? 0) + 1
    return summary
  }, {}),
)
const topAppliedTypes = computed(() =>
  Object.entries(appliedByType.value)
    .sort((first, second) => second[1] - first[1])
    .slice(0, 3)
    .map(([type, count]) => ({
      type: type as KnowledgeItemType,
      count,
      label: knowledgeTypeLabels[type as KnowledgeItemType] ?? type,
    })),
)
const visibleAppliedKnowledge = computed(() => appliedKnowledge.value.slice(0, 3))
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
const selectedKnowledge = computed(() =>
  knowledgeOptions.value.find((item) => item.value === selectedKnowledgeItemId.value),
)
const deliverableOptions = computed(() =>
  props.deliverables.map((deliverable) => ({
    value: deliverable.id,
    title: deliverable.title,
    subtitle: deliverable.dueDate ? 'Com prazo definido' : 'Sem prazo definido',
  })),
)
const canLinkKnowledge = computed(() =>
  Boolean(selectedKnowledgeItemId.value) &&
  (targetScope.value === 'project' || Boolean(selectedDeliverableId.value)),
)
const canManageKnowledge = computed(
  () =>
    auth.can('knowledge.link') ||
    auth.can('knowledge.unlink') ||
    auth.can('knowledge.promote_project'),
)
const valueSignals = computed(() => [
  {
    title: 'Reutiliza padroes aprovados',
    text: 'Evita recomecar criterios tecnicos do zero.',
  },
  {
    title: 'Reduz retrabalho',
    text: 'Traz licoes aprendidas e checklists para o contexto certo.',
  },
  {
    title: 'Acelera decisoes',
    text: 'Mostra referencias e modelos prontos para consulta.',
  },
])
const promoteSteps = [
  { value: 1, title: 'Base', text: 'Nome e motivo' },
  { value: 2, title: 'Tags', text: 'Contexto tecnico' },
  { value: 3, title: 'Uso', text: 'Aplicacao e alertas' },
]
const canAdvancePromoteBase = computed(
  () => Boolean(promoteForm.value.title.trim()) && Boolean(promoteForm.value.reason.trim()),
)
const selectedSuggestedTagIds = computed(() => new Set(promoteForm.value.tagIds))

async function openManagement(panel = 'overview') {
  isManagementOpen.value = true
  activePanel.value = panel

  if (panel === 'apply' && knowledgeStore.items.length === 0) {
    await knowledgeStore.listItems(1, 30)
  }
}

async function showApplyPanel() {
  activePanel.value = 'apply'
  if (knowledgeStore.items.length === 0) {
    await knowledgeStore.listItems(1, 30)
  }
}

async function loadSuggestedTechnicalTags() {
  if (suggestedTechnicalTags.value.length || isLoadingSuggestedTags.value) return

  isLoadingSuggestedTags.value = true

  try {
    const response = await apiClient.technicalTags.list({
      status: 'active',
      limit: 100,
      page: 1,
    })
    const deliverableTerms = new Set(
      props.deliverables.flatMap((deliverable) =>
        normalizeTagText(
          [
            deliverable.title,
            deliverable.description,
            deliverable.type,
            deliverable.type ? deliverableTypeLabels[deliverable.type] : '',
          ].join(' '),
        )
          .split(' ')
          .filter((term) => term.length > 3),
      ),
    )

    suggestedTechnicalTags.value = response.items
      .filter((tag) => {
        const tagTerms = normalizeTagText(`${tag.name} ${tag.slug} ${tag.description ?? ''}`).split(' ')
        return tagTerms.some((term) => deliverableTerms.has(term))
      })
      .slice(0, 8)
  } finally {
    isLoadingSuggestedTags.value = false
  }
}

async function linkKnowledge() {
  if (!canLinkKnowledge.value) return

  const success = await projectsStore.linkKnowledgeItem(props.projectId, {
    knowledgeItemId: selectedKnowledgeItemId.value,
    relationType: relationType.value,
    deliverableId: targetScope.value === 'deliverable' ? selectedDeliverableId.value : undefined,
  })

  if (success) {
    selectedKnowledgeItemId.value = ''
    targetScope.value = 'project'
    selectedDeliverableId.value = ''
    relationType.value = 'reference_for'
    activePanel.value = 'manage'
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

function openPromotePanel() {
  const project = projectsStore.selectedProject
  promoteForm.value.title = project?.name ?? ''
  promoteForm.value.description = project?.name
    ? `Referencia criada a partir do projeto ${project.name}.`
    : ''
  promoteForm.value.tagIds = []
  promoteForm.value.reason = ''
  promoteForm.value.whenToUse = ''
  promoteForm.value.warnings = ''
  promoteStep.value = 1
  showPromoteSuccess.value = false
  activePanel.value = 'promote'
  void loadSuggestedTechnicalTags()
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
    activePanel.value = 'manage'
  }
}

function relationLabel(value: string) {
  return relationTypeOptions.find((item) => item.value === value)?.title ?? value
}

function targetLabel(targetType: string, targetId: string) {
  if (targetType === 'deliverable') {
    return props.deliverables.find((deliverable) => deliverable.id === targetId)?.title ?? 'Entregavel'
  }

  return 'Projeto inteiro'
}

function toggleSuggestedTag(tagId: string) {
  const selected = new Set(promoteForm.value.tagIds)

  if (selected.has(tagId)) {
    selected.delete(tagId)
  } else {
    selected.add(tagId)
  }

  promoteForm.value.tagIds = [...selected]
}

function normalizeTagText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function goToPromoteStep(step: number) {
  if (step > 1 && !canAdvancePromoteBase.value) return
  promoteStep.value = step
}
</script>

<template>
  <section class="project-knowledge">
    <div class="project-knowledge__summary">
      <div class="project-knowledge__copy">
        <span class="project-knowledge__eyebrow">Conhecimento aplicado</span>
        <h2>Use o que a equipe ja sabe para orientar este projeto</h2>
        <p>
          Padroes, modelos, referencias e licoes aprendidas ficam ligados ao projeto para
          acelerar decisoes, evitar retrabalho e preservar contexto tecnico.
        </p>
      </div>

      <div class="project-knowledge__score">
        <strong>{{ appliedCount }}</strong>
        <span>{{ appliedCount === 1 ? 'conhecimento aplicado' : 'conhecimentos aplicados' }}</span>
      </div>

      <div class="project-knowledge__actions">
        <v-btn color="teal" variant="flat" size="large" prepend-icon="$command" @click="openManagement('overview')">
          Gerenciar conhecimentos
        </v-btn>
        <v-btn v-if="auth.can('knowledge.link')" color="teal" variant="tonal" @click="openManagement('apply')">
          Aplicar agora
        </v-btn>
      </div>
    </div>

    <div class="project-knowledge__insights">
      <v-sheet
        v-for="signal in valueSignals"
        :key="signal.title"
        border
        rounded="lg"
        class="project-knowledge__signal"
      >
        <strong>{{ signal.title }}</strong>
        <span>{{ signal.text }}</span>
      </v-sheet>
    </div>

    <v-alert v-if="showPromoteSuccess" type="success" variant="tonal">
      Projeto promovido para a Base de Conhecimento.
    </v-alert>

    <v-sheet border rounded="lg" class="project-knowledge__preview">
      <div class="project-knowledge__preview-head">
        <div>
          <h3>Resumo do projeto</h3>
          <p v-if="appliedCount">
            {{ appliedCount }} item(ns) aplicado(s), {{ deprecatedCount }} depreciado(s) e
            {{ topAppliedTypes.length }} tipo(s) de conhecimento em uso.
          </p>
          <p v-else>
            Nenhum conhecimento aplicado ainda. Comece vinculando uma referencia, padrao ou
            checklist que ajude a equipe.
          </p>
        </div>
        <v-btn color="teal" variant="text" @click="openManagement('manage')">
          Ver detalhes
        </v-btn>
      </div>

      <div v-if="appliedCount" class="project-knowledge__chips">
        <v-chip
          v-for="item in topAppliedTypes"
          :key="item.type"
          color="teal"
          variant="tonal"
          size="small"
        >
          {{ item.label }} · {{ item.count }}
        </v-chip>
      </div>

      <div v-if="visibleAppliedKnowledge.length" class="project-knowledge__applied-preview">
        <RouterLink
          v-for="entry in visibleAppliedKnowledge"
          :key="entry.relationId"
          :to="`/knowledge-base/${entry.knowledgeItem.id}`"
          class="project-knowledge__preview-item"
        >
          <strong>{{ entry.knowledgeItem.title }}</strong>
          <span>
            {{ knowledgeTypeLabels[entry.knowledgeItem.type as keyof typeof knowledgeTypeLabels] }}
            · {{ relationLabel(entry.relationType) }}
          </span>
        </RouterLink>
      </div>
    </v-sheet>

    <v-dialog v-model="isManagementOpen" max-width="1120" scrollable content-class="project-knowledge-dialog">
      <v-card
        class="project-knowledge-modal"
        style="height: min(88vh, 52rem); max-height: calc(100vh - 2rem);"
      >
        <v-card-title class="project-knowledge-modal__title">
          <div>
            <span>Knowledge do projeto</span>
            <small>Use conhecimento aplicado para reduzir retrabalho e acelerar decisoes tecnicas.</small>
          </div>
          <v-btn icon="$close" variant="text" aria-label="Fechar" @click="isManagementOpen = false" />
        </v-card-title>

        <div class="project-knowledge-modal__tabs">
          <v-tabs v-model="activePanel" color="teal" density="comfortable" grow>
            <v-tab value="overview">Panorama</v-tab>
            <v-tab v-if="auth.can('knowledge.link')" value="apply" @click="showApplyPanel">
              Aplicar
            </v-tab>
            <v-tab v-if="auth.can('knowledge.promote_project')" value="promote" @click="openPromotePanel">
              Criar referencia
            </v-tab>
            <v-tab value="manage">Gerenciar</v-tab>
          </v-tabs>
        </div>

        <v-card-text class="project-knowledge-modal__body">
          <v-window v-model="activePanel" class="project-knowledge-modal__window">
            <v-window-item value="overview">
              <div class="project-knowledge-modal__overview">
                <v-sheet border rounded="lg" class="project-knowledge-modal__hero">
                  <div>
                    <h3>Conhecimento aplicado transforma experiencia em execucao</h3>
                    <p>
                      Use esta area para conectar o projeto a padroes ja aprovados, documentos
                      modelo, referencias de obras anteriores e licoes aprendidas pela equipe.
                    </p>
                  </div>
                  <v-btn v-if="auth.can('knowledge.link')" color="teal" variant="flat" @click="showApplyPanel">
                    Aplicar conhecimento
                  </v-btn>
                </v-sheet>

                <div class="project-knowledge-modal__stats">
                  <v-sheet border rounded="lg" class="project-knowledge-modal__stat-card">
                    <strong>{{ appliedCount }}</strong>
                    <span>Aplicados</span>
                  </v-sheet>
                  <v-sheet border rounded="lg" class="project-knowledge-modal__stat-card">
                    <strong>{{ topAppliedTypes.length }}</strong>
                    <span>Tipos em uso</span>
                  </v-sheet>
                  <v-sheet border rounded="lg" class="project-knowledge-modal__stat-card">
                    <strong>{{ deprecatedCount }}</strong>
                    <span>Depreciados</span>
                  </v-sheet>
                </div>

                <v-empty-state
                  v-if="!appliedCount"
                  headline="Este projeto ainda nao usa conhecimento aplicado"
                  text="Comece por uma referencia de projeto, checklist ou padrao tecnico. A equipe ganha contexto sem procurar em varios lugares."
                />
              </div>
            </v-window-item>

            <v-window-item value="apply">
              <div class="project-knowledge-modal__form-grid">
                <v-sheet border rounded="lg" class="project-knowledge-modal__guidance">
                  <span>Passo 1</span>
                  <h3>Escolha o conhecimento certo</h3>
                  <p>
                    Prefira itens publicados, atuais e diretamente ligados ao momento do projeto.
                  </p>
                </v-sheet>

                <div>
                  <v-select
                    v-model="selectedKnowledgeItemId"
                    :items="knowledgeOptions"
                    item-title="title"
                    item-value="value"
                    label="Item da Base de Conhecimento"
                    variant="outlined"
                    :loading="knowledgeStore.isLoading"
                  >
                    <template #item="{ props: itemProps, item }">
                      <v-list-item v-bind="itemProps" :subtitle="item.subtitle">
                        <template #append>
                          <v-chip v-if="item.deprecated" size="x-small" color="warning" variant="tonal">
                            Depreciado
                          </v-chip>
                        </template>
                      </v-list-item>
                    </template>
                  </v-select>

                  <div class="project-knowledge-modal__target-grid">
                    <v-select
                      v-model="targetScope"
                      :items="[
                        { title: 'Projeto inteiro', value: 'project' },
                        { title: 'Entregavel especifico', value: 'deliverable' },
                      ]"
                      item-title="title"
                      item-value="value"
                      label="Onde aplicar este conhecimento?"
                      variant="outlined"
                    />

                    <v-select
                      v-if="targetScope === 'deliverable'"
                      v-model="selectedDeliverableId"
                      :items="deliverableOptions"
                      item-title="title"
                      item-value="value"
                      label="Entregavel"
                      variant="outlined"
                      :disabled="deliverableOptions.length === 0"
                    >
                      <template #item="{ props: itemProps, item }">
                        <v-list-item v-bind="itemProps" :subtitle="item.subtitle" />
                      </template>
                    </v-select>
                  </div>

                  <v-alert
                    v-if="targetScope === 'deliverable' && deliverableOptions.length === 0"
                    type="info"
                    variant="tonal"
                  >
                    Cadastre entregaveis para aplicar conhecimento em uma entrega especifica.
                  </v-alert>

                  <v-select
                    v-model="relationType"
                    :items="relationTypeOptions"
                    item-title="title"
                    item-value="value"
                    label="Como isso ajuda o projeto?"
                    variant="outlined"
                  />

                  <v-alert v-if="selectedKnowledge?.deprecated" type="warning" variant="tonal">
                    Este item esta depreciado. Use apenas se ainda fizer sentido para o contexto deste projeto.
                  </v-alert>

                  <v-sheet border rounded="lg" class="project-knowledge-modal__value-strip">
                    <strong>Resultado esperado</strong>
                    <span>O item escolhido passa a aparecer no cockpit do projeto como referencia contextual para a equipe.</span>
                  </v-sheet>

                  <div class="project-knowledge-modal__actions">
                    <v-btn variant="text" @click="activePanel = 'overview'">Voltar</v-btn>
                    <v-btn
                      color="teal"
                      variant="flat"
                      :disabled="!canLinkKnowledge"
                      @click="linkKnowledge"
                    >
                      Aplicar conhecimento
                    </v-btn>
                  </div>
                </div>
              </div>
            </v-window-item>

            <v-window-item value="promote">
              <div class="project-knowledge-modal__wizard">
                <v-sheet border rounded="lg" class="project-knowledge-modal__wizard-head">
                  <div>
                    <span>Fluxo guiado</span>
                    <h3>Transforme uma decisao deste projeto em conhecimento reutilizavel</h3>
                    <p>
                      Primeiro defina o valor da referencia, depois organize as tags com espaco
                      de verdade e finalize com orientacoes de uso.
                    </p>
                  </div>
                  <v-chip color="teal" variant="tonal">{{ promoteForm.tagIds.length }} tag(s)</v-chip>
                </v-sheet>

                <div class="project-knowledge-modal__steps">
                  <button
                    v-for="step in promoteSteps"
                    :key="step.value"
                    type="button"
                    class="project-knowledge-modal__step"
                    :class="{ 'project-knowledge-modal__step--active': promoteStep === step.value }"
                    @click="goToPromoteStep(step.value)"
                  >
                    <strong>{{ step.value }}</strong>
                    <span>{{ step.title }}</span>
                    <small>{{ step.text }}</small>
                  </button>
                </div>

                <div v-if="promoteStep === 1" class="project-knowledge-modal__step-panel">
                  <v-sheet border rounded="lg" class="project-knowledge-modal__guidance project-knowledge-modal__guidance--inline">
                    <span>Passo 1</span>
                    <h3>Qual conhecimento vale guardar?</h3>
                    <p>
                      Diga o que este projeto ensina e por que isso deve virar referencia para a equipe.
                    </p>
                  </v-sheet>

                  <v-text-field v-model="promoteForm.title" label="Titulo da referencia *" variant="outlined" />
                  <v-textarea v-model="promoteForm.description" label="Descricao" variant="outlined" rows="2" />
                  <v-textarea v-model="promoteForm.reason" label="Por que isso merece virar referencia? *" variant="outlined" rows="3" />

                  <div class="project-knowledge-modal__actions">
                    <v-btn variant="text" @click="activePanel = 'overview'">Cancelar</v-btn>
                    <v-btn
                      color="teal"
                      variant="flat"
                      :disabled="!canAdvancePromoteBase"
                      @click="promoteStep = 2"
                    >
                      Avancar para tags
                    </v-btn>
                  </div>
                </div>

                <div v-else-if="promoteStep === 2" class="project-knowledge-modal__step-panel project-knowledge-modal__step-panel--tags">
                  <v-sheet border rounded="lg" class="project-knowledge-modal__value-strip">
                    <strong>Organize para encontrar depois</strong>
                    <span>
                      Tags conectam essa referencia a disciplinas, dores operacionais, contexto do
                      cliente e futuras recomendacoes do cockpit.
                    </span>
                  </v-sheet>

                  <v-sheet border rounded="lg" class="project-knowledge-modal__tag-suggestions">
                    <div>
                      <strong>Tags sugeridas pelos entregáveis</strong>
                      <span>
                        A plataforma usa os tipos de entregáveis como pista para formar linhas de raciocínio e recomendação.
                      </span>
                    </div>
                    <div class="project-knowledge-modal__suggested-tags">
                      <v-chip
                        v-for="tag in suggestedTechnicalTags"
                        :key="tag.id"
                        :color="selectedSuggestedTagIds.has(tag.id) ? 'teal' : 'blue-grey'"
                        :variant="selectedSuggestedTagIds.has(tag.id) ? 'flat' : 'tonal'"
                        size="small"
                        @click="toggleSuggestedTag(tag.id)"
                      >
                        {{ tag.name }}
                      </v-chip>
                      <v-chip v-if="isLoadingSuggestedTags" color="teal" variant="tonal" size="small">
                        Buscando sugestões...
                      </v-chip>
                      <span
                        v-if="!isLoadingSuggestedTags && suggestedTechnicalTags.length === 0"
                        class="project-knowledge-modal__muted"
                      >
                        Nenhuma tag existente combinou com os entregáveis. Crie ou selecione tags abaixo.
                      </span>
                    </div>
                  </v-sheet>

                  <TechnicalTagSelector
                    v-model="promoteForm.tagIds"
                    :allow-create="true"
                    :max-list-height="430"
                    :categories="['project_type','technical_discipline','client_context','knowledge_purpose','operational_pain']"
                  />

                  <div class="project-knowledge-modal__actions">
                    <v-btn variant="text" @click="promoteStep = 1">Voltar</v-btn>
                    <v-btn color="teal" variant="flat" @click="promoteStep = 3">
                      Avancar para uso
                    </v-btn>
                  </div>
                </div>

                <div v-else class="project-knowledge-modal__step-panel">
                  <v-sheet border rounded="lg" class="project-knowledge-modal__guidance project-knowledge-modal__guidance--inline">
                    <span>Passo 3</span>
                    <h3>Como a equipe deve usar isso?</h3>
                    <p>
                      Feche a referencia com contexto pratico. Isso evita conhecimento bonito,
                      mas impossivel de aplicar.
                    </p>
                  </v-sheet>

                  <v-textarea v-model="promoteForm.whenToUse" label="Quando usar esta referencia" variant="outlined" rows="3" />
                  <v-textarea v-model="promoteForm.warnings" label="Alertas e observacoes" variant="outlined" rows="3" />

                  <v-sheet border rounded="lg" class="project-knowledge-modal__value-strip">
                    <strong>Valor para proximos projetos</strong>
                    <span>A referencia nasce como rascunho para curadoria, preservando uma decisao tecnica reutilizavel.</span>
                  </v-sheet>

                  <div class="project-knowledge-modal__actions">
                    <v-btn variant="text" @click="promoteStep = 2">Voltar para tags</v-btn>
                    <v-btn
                      color="indigo"
                      variant="flat"
                      :loading="isSavingPromotion"
                      :disabled="!canAdvancePromoteBase"
                      @click="promoteProject"
                    >
                      Criar referencia
                    </v-btn>
                  </div>
                </div>
              </div>
            </v-window-item>

            <v-window-item value="manage">
              <div class="project-knowledge-modal__manage">
                <v-empty-state
                  v-if="!appliedKnowledge.length"
                  headline="Nada aplicado ainda"
                  text="Aplique uma referencia, modelo, checklist ou licao aprendida para deixar o projeto mais orientado."
                />

                <v-list v-else lines="three" class="project-knowledge-modal__list">
                  <v-list-item
                    v-for="entry in appliedKnowledge"
                    :key="entry.relationId"
                    :to="`/knowledge-base/${entry.knowledgeItem.id}`"
                  >
                    <v-list-item-title>{{ entry.knowledgeItem.title }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ knowledgeTypeLabels[entry.knowledgeItem.type as keyof typeof knowledgeTypeLabels] }}
                      · {{ knowledgeStatusLabels[entry.knowledgeItem.status as keyof typeof knowledgeStatusLabels] }}
                      · {{ relationLabel(entry.relationType) }}
                      · {{ targetLabel(entry.targetType, entry.targetId) }}
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
              </div>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog
      :model-value="Boolean(confirmRemoveRelationId)"
      max-width="520"
      @update:model-value="(open) => { if (!open) confirmRemoveRelationId = null }"
    >
      <v-card>
        <v-card-title>Remover conhecimento do projeto?</v-card-title>
        <v-card-text>
          O item continuara existindo na Base de Conhecimento, mas deixara de orientar este projeto.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmRemoveRelationId = null">Cancelar</v-btn>
          <v-btn color="error" variant="flat" @click="removeRelation">Remover vinculo</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>

<style scoped>
.project-knowledge {
  display: grid;
  gap: 1rem;
  border: 1px solid #9bd9cb;
  border-radius: 1.1rem;
  background:
    radial-gradient(circle at top left, rgb(0 150 136 / 0.14), transparent 24rem),
    linear-gradient(180deg, #f0fbf7, #ffffff 54%);
  padding: 1rem;
  box-shadow: 0 20px 48px rgb(15 45 38 / 0.09);
}

.project-knowledge__summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 1.25rem;
  align-items: center;
  border: 1px solid #72c7b6;
  border-radius: 1rem;
  background:
    radial-gradient(circle at 85% 10%, rgb(150 226 207 / 0.34), transparent 17rem),
    linear-gradient(135deg, #10231f, #145246 58%, #e5fbf3);
  padding: 1.25rem;
  box-shadow: 0 18px 42px rgb(15 45 38 / 0.14);
}

.project-knowledge__eyebrow {
  color: #a9f3de;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.project-knowledge__copy h2 {
  margin: 0.25rem 0;
  color: #ffffff;
  font-size: clamp(1.4rem, 2vw, 2rem);
  line-height: 1.1;
}

.project-knowledge__copy p,
.project-knowledge__preview-head p,
.project-knowledge-modal__title small,
.project-knowledge-modal__hero p,
.project-knowledge-modal__guidance p {
  margin: 0;
  color: #60716b;
}

.project-knowledge__summary .project-knowledge__copy p {
  max-width: 48rem;
  color: rgb(255 255 255 / 0.82);
}

.project-knowledge__score {
  display: grid;
  justify-items: center;
  min-width: 8.5rem;
  border-radius: 1rem;
  border: 1px solid rgb(215 242 231 / 0.66);
  background: rgb(255 255 255 / 0.94);
  padding: 1rem;
  box-shadow: 0 16px 30px rgb(0 0 0 / 0.14);
}

.project-knowledge__score strong {
  color: #00897b;
  font-size: 2.8rem;
  line-height: 1;
}

.project-knowledge__score span {
  color: #60716b;
  font-size: 0.8rem;
  text-align: center;
}

.project-knowledge__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
}

.project-knowledge__insights {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.project-knowledge__signal {
  position: relative;
  display: grid;
  gap: 0.3rem;
  overflow: hidden;
  border-color: #b9ddd2;
  background:
    linear-gradient(145deg, #ffffff, #f0fbf7),
    #ffffff;
  padding: 0.9rem;
  box-shadow: 0 12px 24px rgb(15 45 38 / 0.06);
}

.project-knowledge__signal::before {
  width: 2.4rem;
  height: 0.28rem;
  border-radius: 999px;
  background: #00a98f;
  content: '';
}

.project-knowledge__signal strong,
.project-knowledge__preview-item strong,
.project-knowledge-modal__hero h3,
.project-knowledge-modal__guidance h3 {
  color: #14231f;
}

.project-knowledge__signal span,
.project-knowledge__preview-item span {
  color: #60716b;
  font-size: 0.9rem;
}

.project-knowledge__preview {
  display: grid;
  gap: 0.85rem;
  border-color: #b9ddd2;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 0.94), rgb(232 248 242 / 0.76)),
    #ffffff;
  padding: 1rem;
  box-shadow: inset 0 0 0 1px rgb(20 61 51 / 0.03);
}

.project-knowledge__preview-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.project-knowledge__preview-head h3 {
  margin: 0 0 0.25rem;
  color: #14231f;
}

.project-knowledge__chips,
.project-knowledge__applied-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.project-knowledge__preview-item {
  display: grid;
  min-width: min(100%, 18rem);
  border: 1px solid #b9ddd2;
  border-radius: 0.75rem;
  background:
    linear-gradient(135deg, #ffffff, #effaf6),
    #fbfffd;
  padding: 0.75rem;
  text-decoration: none;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.project-knowledge__preview-item:hover {
  border-color: #00a98f;
  transform: translateY(-0.12rem);
  box-shadow: 0 12px 24px rgb(15 45 38 / 0.1);
}

.project-knowledge-modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #b9ddd2;
  background: #f4faf7;
}

:global(.project-knowledge-dialog) {
  width: min(1120px, calc(100vw - 2rem));
  height: min(88vh, 52rem);
  max-height: calc(100dvh - 2rem);
  margin: 1rem;
  overflow: hidden;
}

.project-knowledge-modal__title {
  display: flex;
  flex: 0 0 auto;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid #cfe5de;
  background:
    linear-gradient(135deg, #10231f, #143d33 54%, #267365),
    #10231f;
  padding: 1rem 1.25rem;
}

.project-knowledge-modal__title > div {
  display: grid;
}

.project-knowledge-modal__title span {
  color: #ffffff;
  font-weight: 850;
}

.project-knowledge-modal__title small {
  color: #d7f2e7;
}

.project-knowledge-modal__title :deep(.v-btn) {
  color: #ffffff;
}

.project-knowledge-modal__tabs {
  flex: 0 0 auto;
  border-bottom: 1px solid #d7e9e2;
  background: #ffffff;
  padding: 0 1rem;
}

.project-knowledge-modal__body {
  display: block;
  flex: 1 1 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: scroll;
  padding: 1rem 1.25rem 1.25rem;
  scrollbar-color: #8ccbbd #eef7f3;
  scrollbar-width: thin;
}

.project-knowledge-modal__body::-webkit-scrollbar {
  width: 0.65rem;
}

.project-knowledge-modal__body::-webkit-scrollbar-track {
  background: #eef7f3;
}

.project-knowledge-modal__body::-webkit-scrollbar-thumb {
  border: 0.15rem solid #eef7f3;
  border-radius: 999px;
  background: #8ccbbd;
}

.project-knowledge-modal__window {
  display: block;
  min-height: 0;
}

.project-knowledge-modal__window :deep(.v-window__container),
.project-knowledge-modal__window :deep(.v-window-item) {
  min-height: 0;
}

.project-knowledge-modal__overview,
.project-knowledge-modal__manage,
.project-knowledge-modal__form-grid {
  display: grid;
  gap: 1rem;
}

.project-knowledge-modal__hero {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  border-color: #b9ddd2;
  background:
    linear-gradient(135deg, rgb(215 242 231 / 0.88), rgb(255 255 255 / 0.96) 64%),
    #ffffff;
  padding: 1.1rem;
}

.project-knowledge-modal__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.project-knowledge-modal__stat-card {
  display: grid;
  gap: 0.25rem;
  border-color: #d7e9e2;
  background: #ffffff;
  padding: 1rem;
}

.project-knowledge-modal__stats strong {
  color: #123c32;
  font-size: 1.9rem;
}

.project-knowledge-modal__stats span {
  color: #60716b;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
}

.project-knowledge-modal__form-grid {
  grid-template-columns: minmax(14rem, 0.7fr) minmax(0, 1.3fr);
}

.project-knowledge-modal__target-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.project-knowledge-modal__wizard,
.project-knowledge-modal__step-panel {
  display: grid;
  gap: 1rem;
  min-height: 0;
}

.project-knowledge-modal__wizard-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-color: #b9ddd2;
  background:
    linear-gradient(135deg, rgb(215 242 231 / 0.88), rgb(255 255 255 / 0.96) 64%),
    #ffffff;
  padding: 1rem;
}

.project-knowledge-modal__wizard-head span,
.project-knowledge-modal__guidance span {
  color: #60716b;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
}

.project-knowledge-modal__wizard-head h3 {
  margin: 0.2rem 0;
  color: #14231f;
}

.project-knowledge-modal__wizard-head p {
  margin: 0;
  color: #60716b;
}

.project-knowledge-modal__steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.project-knowledge-modal__step {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.15rem 0.65rem;
  align-items: center;
  border: 1px solid #d7e9e2;
  border-radius: 0.7rem;
  background: #ffffff;
  color: #14231f;
  cursor: pointer;
  padding: 0.75rem;
  text-align: left;
}

.project-knowledge-modal__step strong {
  display: grid;
  grid-row: span 2;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 999px;
  background: #d7f2e7;
  color: #143d33;
}

.project-knowledge-modal__step span {
  font-weight: 800;
}

.project-knowledge-modal__step small {
  color: #60716b;
}

.project-knowledge-modal__step--active {
  border-color: #267365;
  background: #f8fffc;
  box-shadow: 0 10px 24px rgb(15 45 38 / 0.08);
}

.project-knowledge-modal__step-panel {
  border: 1px solid #d7e9e2;
  border-radius: 0.75rem;
  background: #ffffff;
  padding: 1rem;
}

.project-knowledge-modal__step-panel--tags {
  background: #fbfffd;
}

.project-knowledge-modal__guidance {
  align-self: start;
  position: sticky;
  top: 0;
  border-color: #b9ddd2;
  background:
    linear-gradient(180deg, #f8fffc, #ffffff),
    #ffffff;
  padding: 1rem;
}

.project-knowledge-modal__guidance--inline {
  position: static;
}

.project-knowledge-modal__value-strip {
  display: grid;
  gap: 0.25rem;
  border-color: #cce5dd;
  background: #f8fffc;
  margin-top: 0.25rem;
  padding: 0.85rem;
}

.project-knowledge-modal__value-strip strong {
  color: #143d33;
}

.project-knowledge-modal__value-strip span {
  color: #60716b;
}

.project-knowledge-modal__tag-suggestions {
  display: grid;
  gap: 0.75rem;
  border-color: #b9ddd2;
  background:
    linear-gradient(135deg, #f0fbf7, #ffffff 62%),
    #ffffff;
  padding: 0.9rem;
}

.project-knowledge-modal__tag-suggestions > div:first-child {
  display: grid;
  gap: 0.2rem;
}

.project-knowledge-modal__tag-suggestions strong {
  color: #143d33;
}

.project-knowledge-modal__tag-suggestions span,
.project-knowledge-modal__muted {
  color: #60716b;
  font-size: 0.9rem;
}

.project-knowledge-modal__suggested-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.project-knowledge-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.project-knowledge-modal__list {
  border: 1px solid #d8e5df;
  border-radius: 0.75rem;
  background: #ffffff;
}

@media (max-width: 980px) {
  .project-knowledge__summary,
  .project-knowledge-modal__form-grid {
    grid-template-columns: 1fr;
  }

  .project-knowledge__actions {
    justify-content: flex-start;
  }
}

@media (max-width: 760px) {
  .project-knowledge__insights,
  .project-knowledge-modal__stats,
  .project-knowledge-modal__target-grid,
  .project-knowledge-modal__steps {
    grid-template-columns: 1fr;
  }

  .project-knowledge__preview-head,
  .project-knowledge-modal__hero,
  .project-knowledge-modal__wizard-head {
    display: grid;
  }
}
</style>
