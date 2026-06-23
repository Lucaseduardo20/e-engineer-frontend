<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import TechnicalTagSelector from '@/modules/technical-taxonomy/components/TechnicalTagSelector.vue'
import { projectsService } from '@/modules/projects/services/projects.service'
import type { ProjectBaseRecommendation } from '@/shared/types/api-contracts'
import type { CreateProjectFromBaseRequest, CreateProjectRequest } from '@/shared/http/api'

const props = defineProps<{
  saving?: boolean
}>()
const emit = defineEmits<{
  create: [payload: CreateProjectRequest]
  'create-from-base': [payload: CreateProjectFromBaseRequest]
  cancel: []
}>()

const step = ref(1)
const projectName = ref('')
const projectType = ref('projeto tecnico')
const tagIds = ref<string[]>([])
const selectedBaseId = ref<string | null>(null)
const selectedDeliverableIds = ref<string[]>([])
const recommendations = ref<ProjectBaseRecommendation[]>([])
const inheritTags = ref(true)
const isLoadingRecommendations = ref(false)
let recommendationTimeout: ReturnType<typeof setTimeout> | undefined

const selectedBase = computed<ProjectBaseRecommendation | null>(
  () => recommendations.value.find((item) => item.project.id === selectedBaseId.value) ?? null,
)
const canGoNext = computed(() => {
  if (step.value === 1) return Boolean(projectName.value.trim())
  if (step.value === 4 && selectedBase.value?.deliverablesPreview.length) {
    return selectedDeliverableIds.value.length > 0
  }
  return true
})
const finalProjectType = computed(
  () => selectedBase.value?.project.projectType || projectType.value.trim() || 'projeto tecnico',
)
const structureSummary = computed(() => {
  const base = selectedBase.value
  if (!base) return 'Projeto criado do zero, com tags para guiar recomendacoes futuras.'

  return `${selectedDeliverableIds.value.length} de ${base.deliverablesPreview.length} entregavel(is) selecionado(s). Documentos e revisoes da base ficam apenas como referencia visual.`
})
const canUseBase = computed(() => Boolean(selectedBase.value))
const selectedBaseMatchedTagNames = computed(() =>
  (selectedBase.value?.matchedTags ?? []).slice(0, 4).map((tag) => tag.name).join(', '),
)

watch(
  tagIds,
  (ids) => {
    selectedBaseId.value = null
    if (recommendationTimeout) clearTimeout(recommendationTimeout)
    if (!ids.length) {
      recommendations.value = []
      return
    }
    recommendationTimeout = setTimeout(async () => {
      isLoadingRecommendations.value = true
      try {
        const response = await projectsService.recommendBases({ tagIds: ids, limit: 6 })
        recommendations.value = response.items
      } finally {
        isLoadingRecommendations.value = false
      }
    }, 250)
  },
  { deep: true },
)

watch(selectedBaseId, () => {
  selectedDeliverableIds.value = selectedBase.value?.deliverablesPreview.map((item) => item.id) ?? []
})

function nextStep() {
  if (!canGoNext.value) return
  step.value = Math.min(step.value + 1, 5)
}

function previousStep() {
  step.value = Math.max(step.value - 1, 1)
}

function submit() {
  if (!projectName.value.trim()) return

  if (selectedBase.value) {
    emit('create-from-base', {
      baseProjectId: selectedBase.value.project.id,
      name: projectName.value.trim(),
      projectType: selectedBase.value.project.projectType || 'projeto tecnico',
      tagIds: tagIds.value,
      inheritTags: inheritTags.value,
      inheritDeliverables: false,
      deliverablesToInherit: selectedDeliverableIds.value,
    })
    return
  }

  emit('create', {
    name: projectName.value.trim(),
    projectType: finalProjectType.value,
    tagIds: tagIds.value,
  })
}

function useRecommendationAsBase(projectId: string) {
  selectedBaseId.value = projectId
  step.value = 4
}

function startFromScratch() {
  selectedBaseId.value = null
  selectedDeliverableIds.value = []
  step.value = 5
}

function selectAllDeliverables() {
  selectedDeliverableIds.value = selectedBase.value?.deliverablesPreview.map((item) => item.id) ?? []
}

function clearDeliverables() {
  selectedDeliverableIds.value = []
}

function toggleDeliverable(deliverableId: string, checked: boolean | null) {
  const current = new Set(selectedDeliverableIds.value)

  if (checked) {
    current.add(deliverableId)
  } else {
    current.delete(deliverableId)
  }

  selectedDeliverableIds.value = [...current]
}
</script>

<template>
  <v-card rounded="xl" class="project-create-wizard">
    <v-card-title class="project-create-wizard__title">
      <div>
        <span>Novo projeto guiado</span>
        <h2>Comece com tags e reutilize uma estrutura tecnica pronta.</h2>
      </div>
      <v-btn icon="$close" variant="text" :disabled="saving" @click="emit('cancel')" />
    </v-card-title>

    <v-card-text class="project-create-wizard__body">
      <div class="project-create-wizard__steps">
        <button
          v-for="item in [
            { value: 1, label: 'Dados' },
            { value: 2, label: 'Contexto' },
            { value: 3, label: 'Partida' },
            { value: 4, label: 'Entregaveis' },
            { value: 5, label: 'Confirmar' },
          ]"
          :key="item.value"
          type="button"
          :class="{ 'project-create-wizard__step--active': step === item.value }"
          class="project-create-wizard__step"
          @click="step = item.value"
        >
          <strong>{{ item.value }}</strong>
          <span>{{ item.label }}</span>
        </button>
      </div>

      <section v-if="step === 1" class="project-create-wizard__panel">
        <v-sheet border rounded="lg" class="project-create-wizard__hero">
          <span>Passo 1</span>
          <h3>Qual projeto tecnico vamos iniciar?</h3>
          <p>Comece com poucos dados. O contexto tecnico e a base escolhida refinam a estrutura depois.</p>
        </v-sheet>
        <div class="project-create-wizard__field-grid">
          <v-text-field
            v-model="projectName"
            label="Nome do projeto"
            maxlength="160"
            counter
            variant="outlined"
            density="comfortable"
            :disabled="saving"
            autofocus
          />
          <v-text-field
            v-model="projectType"
            label="Tipo tecnico"
            maxlength="120"
            variant="outlined"
            density="comfortable"
            :disabled="saving"
          />
        </div>
      </section>

      <section v-else-if="step === 2" class="project-create-wizard__panel">
        <v-sheet border rounded="lg" class="project-create-wizard__hero">
          <span>Passo 2</span>
          <h3>Escolha as tags que descrevem o raciocinio tecnico.</h3>
          <p>As tags acionam sugestoes, mas voce sempre pode continuar sem recomendacoes.</p>
        </v-sheet>
        <TechnicalTagSelector
          v-model="tagIds"
          label="Tags do novo projeto"
          hint="Selecione disciplinas, tipo de projeto, documentos e contexto tecnico para encontrar bases reutilizaveis."
          :categories="['project_type','technical_discipline','document_type','client_context','project_stage','operational_pain']"
          :allowed-statuses="['active']"
          :allow-create="false"
          :max-tags="12"
          :max-list-height="300"
          :disabled="saving"
        />
      </section>

      <section v-else-if="step === 3" class="project-create-wizard__panel">
        <v-sheet border rounded="lg" class="project-create-wizard__hero">
          <span>Passo 3</span>
          <h3>Escolha o ponto de partida.</h3>
          <p>Use uma base quando fizer sentido ou comece do zero mantendo o contexto tecnico selecionado.</p>
        </v-sheet>
        <v-progress-linear v-if="isLoadingRecommendations" indeterminate color="teal" />
        <div class="project-create-wizard__start-options">
          <v-sheet
            border
            rounded="lg"
            class="project-create-wizard__start-card"
            :class="{ 'project-create-wizard__start-card--selected': !selectedBaseId }"
            @click="selectedBaseId = null"
          >
            <strong>Comecar do zero</strong>
            <p>Cria o projeto com as tags selecionadas e sem herdar estrutura.</p>
            <v-btn size="small" color="teal" variant="tonal" @click.stop="startFromScratch">
              Escolher esta opcao
            </v-btn>
          </v-sheet>
        </div>
        <div v-if="recommendations.length" class="project-create-wizard__recommendations">
          <v-sheet
            v-for="recommendation in recommendations"
            :key="recommendation.project.id"
            border
            rounded="lg"
            class="project-create-wizard__base-card"
            :class="{ 'project-create-wizard__base-card--selected': selectedBaseId === recommendation.project.id }"
            @click="selectedBaseId = recommendation.project.id"
          >
            <div class="project-create-wizard__base-head">
              <div>
                <strong>{{ recommendation.project.name }}</strong>
                <span>{{ recommendation.project.projectType || 'Projeto tecnico' }}</span>
              </div>
              <v-chip color="teal" variant="tonal" size="small">
                Aderencia {{ recommendation.score }}
              </v-chip>
            </div>
            <p>Combina com o contexto tecnico selecionado.</p>
            <small>{{ recommendation.deliverablesPreview.length }} entregavel(is), {{ recommendation.documentsPreview.length }} documento(s) e {{ recommendation.reviewsCount }} revisao(oes) encontrados.</small>
            <div class="project-create-wizard__chips">
              <v-chip
                v-for="tag in recommendation.matchedTags.slice(0, 5)"
                :key="tag.id"
                size="small"
                color="teal"
                variant="tonal"
              >
                {{ tag.name }}
              </v-chip>
            </div>
            <div v-if="recommendation.deliverablesPreview.length" class="project-create-wizard__deliverables-preview">
              <span
                v-for="deliverable in recommendation.deliverablesPreview.slice(0, 4)"
                :key="deliverable.id"
              >
                {{ deliverable.title }}
              </span>
            </div>
            <v-btn
              size="small"
              color="teal"
              variant="tonal"
              @click.stop="useRecommendationAsBase(recommendation.project.id)"
            >
              Usar como base
            </v-btn>
          </v-sheet>
        </div>
        <v-empty-state
          v-else-if="!isLoadingRecommendations"
          headline="Nenhum projeto semelhante encontrado"
          text="Voce ainda pode criar do zero. As tags ficarao como contexto para recomendacoes futuras."
        />
      </section>

      <section v-else-if="step === 4" class="project-create-wizard__panel">
        <v-sheet border rounded="lg" class="project-create-wizard__hero">
          <span>Passo 4</span>
          <h3>Revise os entregaveis herdados.</h3>
          <p>Escolha apenas o que realmente ajuda este novo projeto. A base original nao sera alterada.</p>
        </v-sheet>
        <v-alert v-if="!selectedBase" type="info" variant="tonal">
          Sem projeto base selecionado. O projeto sera criado do zero com o contexto tecnico escolhido.
        </v-alert>
        <template v-else>
          <v-sheet border rounded="lg" class="project-create-wizard__review-card">
            <span>Base selecionada</span>
            <h3>{{ selectedBase.project.name }}</h3>
            <p v-if="selectedBaseMatchedTagNames">Semelhante por {{ selectedBaseMatchedTagNames }}.</p>
            <v-chip color="teal" variant="tonal" size="small">
              Aderencia {{ selectedBase.score }}
            </v-chip>
            <div class="project-create-wizard__inline-actions">
              <v-btn size="small" variant="tonal" color="teal" @click="selectAllDeliverables">
                Selecionar todos
              </v-btn>
              <v-btn size="small" variant="text" color="teal" @click="clearDeliverables">
                Limpar selecao
              </v-btn>
            </div>
          </v-sheet>
          <v-sheet border rounded="lg" class="project-create-wizard__review-card">
            <span>Entregaveis da base</span>
            <h3>Escolha o que entra no novo projeto</h3>
            <div v-if="selectedBase.deliverablesPreview.length" class="project-create-wizard__deliverables-list">
              <label
                v-for="deliverable in selectedBase.deliverablesPreview"
                :key="deliverable.id"
                class="project-create-wizard__deliverable-option"
              >
                <v-checkbox
                  :model-value="selectedDeliverableIds.includes(deliverable.id)"
                  color="teal"
                  density="compact"
                  hide-details
                  @update:model-value="toggleDeliverable(deliverable.id, $event)"
                />
                <span>
                  <strong>{{ deliverable.title }}</strong>
                  <small>{{ deliverable.type }} · {{ deliverable.status }}</small>
                </span>
                <span class="project-create-wizard__deliverable-tags">
                  <v-chip
                    v-for="tag in deliverable.tags.slice(0, 3)"
                    :key="tag.id"
                    size="x-small"
                    color="teal"
                    variant="tonal"
                  >
                    {{ tag.name }}
                  </v-chip>
                </span>
              </label>
            </div>
            <v-alert v-else type="info" variant="tonal">
              O projeto base nao possui entregaveis disponiveis para heranca.
            </v-alert>
          </v-sheet>
        </template>
      </section>

      <section v-else class="project-create-wizard__panel">
        <v-sheet border rounded="lg" class="project-create-wizard__review-card">
          <span>Resumo</span>
          <h3>{{ projectName || 'Novo projeto tecnico' }}</h3>
          <p>{{ structureSummary }}</p>
          <div class="project-create-wizard__chips">
            <v-chip color="teal" variant="flat">{{ tagIds.length }} tag(s)</v-chip>
            <v-chip v-if="selectedBase" color="indigo" variant="tonal">
              Base: {{ selectedBase.project.name }}
            </v-chip>
            <v-chip v-else color="blue-grey" variant="tonal">Sem projeto base</v-chip>
          </div>
        </v-sheet>
        <v-sheet v-if="selectedBase" border rounded="lg" class="project-create-wizard__review-card">
          <span>Uso da base</span>
          <h3>Reaproveitar sem copiar historico</h3>
          <v-checkbox
            v-model="inheritTags"
            color="teal"
            density="comfortable"
            hide-details
            label="Manter tags tecnicas da base"
          />
        </v-sheet>
        <v-alert type="info" variant="tonal">
          A base registra a origem e ajuda a reaproveitar contexto. Documentos, versoes, revisoes, historico, responsaveis e prazos antigos nao serao copiados automaticamente.
        </v-alert>
      </section>
    </v-card-text>

    <v-card-actions class="project-create-wizard__actions">
      <v-btn variant="text" :disabled="saving" @click="step === 1 ? emit('cancel') : previousStep()">
        {{ step === 1 ? 'Cancelar' : 'Voltar' }}
      </v-btn>
      <v-spacer />
      <v-btn v-if="step < 5" color="teal" :disabled="!canGoNext || saving" @click="nextStep">
        Continuar
      </v-btn>
      <v-btn v-else color="teal" :loading="saving" :disabled="!projectName.trim()" @click="submit">
        Criar projeto
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.project-create-wizard {
  border: 1px solid #b8ddd2;
  background:
    radial-gradient(circle at top right, rgb(0 150 136 / 0.16), transparent 20rem),
    #ffffff;
}

.project-create-wizard__title {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  background: linear-gradient(135deg, #10342d, #1f7a68);
  color: white;
  padding: 1.1rem 1.25rem;
}

.project-create-wizard__title span,
.project-create-wizard__hero span,
.project-create-wizard__review-card span {
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.project-create-wizard__title h2,
.project-create-wizard__hero h3,
.project-create-wizard__review-card h3 {
  margin: 0.2rem 0 0;
}

.project-create-wizard__body,
.project-create-wizard__panel {
  display: grid;
  gap: 1rem;
}

.project-create-wizard__steps {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.65rem;
}

.project-create-wizard__step {
  display: flex;
  gap: 0.55rem;
  align-items: center;
  border: 1px solid #d2e6df;
  border-radius: 0.9rem;
  background: #ffffff;
  color: #60716b;
  padding: 0.75rem;
  text-align: left;
}

.project-create-wizard__step strong {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 999px;
  background: #dff5ed;
  color: #11695c;
}

.project-create-wizard__step--active {
  border-color: #009688;
  box-shadow: 0 10px 24px rgb(0 150 136 / 0.12);
  color: #14231f;
}

.project-create-wizard__hero,
.project-create-wizard__review-card {
  border-color: #b8ddd2;
  background:
    linear-gradient(135deg, rgb(232 248 242 / 0.85), #ffffff),
    #ffffff;
  padding: 1rem;
}

.project-create-wizard__field-grid,
.project-create-wizard__start-options {
  display: grid;
  gap: 0.8rem;
}

.project-create-wizard__start-card {
  display: grid;
  gap: 0.65rem;
  cursor: pointer;
  border-color: #d4e8e1;
  padding: 0.9rem;
  transition: 0.16s ease;
}

.project-create-wizard__start-card:hover,
.project-create-wizard__start-card--selected {
  border-color: #009688;
  background: #f2fffb;
  box-shadow: 0 14px 30px rgb(0 150 136 / 0.1);
}

.project-create-wizard__hero span,
.project-create-wizard__review-card span {
  color: #267365;
}

.project-create-wizard__hero p,
.project-create-wizard__review-card p,
.project-create-wizard__base-card p,
.project-create-wizard__start-card p,
.project-create-wizard__base-card small,
.project-create-wizard__base-head span {
  margin: 0;
  color: #60716b;
}

.project-create-wizard__start-card strong {
  color: #14231f;
}

.project-create-wizard__recommendations {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: 0.8rem;
}

.project-create-wizard__base-card {
  display: grid;
  gap: 0.7rem;
  cursor: pointer;
  border-color: #d4e8e1;
  padding: 0.9rem;
  transition: 0.16s ease;
}

.project-create-wizard__base-card:hover,
.project-create-wizard__base-card--selected {
  border-color: #009688;
  background: #f2fffb;
  box-shadow: 0 14px 30px rgb(0 150 136 / 0.12);
}

.project-create-wizard__base-head {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.project-create-wizard__base-head strong {
  display: block;
  color: #14231f;
}

.project-create-wizard__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.project-create-wizard__inline-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.project-create-wizard__deliverables-preview,
.project-create-wizard__deliverables-list {
  display: grid;
  gap: 0.5rem;
}

.project-create-wizard__deliverables-preview span {
  overflow: hidden;
  border: 1px solid #d4e8e1;
  border-radius: 0.45rem;
  padding: 0.4rem 0.55rem;
  color: #32554c;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-create-wizard__deliverable-option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.7rem;
  align-items: center;
  border: 1px solid #d4e8e1;
  border-radius: 0.55rem;
  padding: 0.55rem 0.7rem;
}

.project-create-wizard__deliverable-option strong,
.project-create-wizard__deliverable-option small {
  display: block;
}

.project-create-wizard__deliverable-option small {
  color: #60716b;
}

.project-create-wizard__deliverable-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.25rem;
}

.project-create-wizard__actions {
  padding: 0.85rem 1.25rem 1.15rem;
}

@media (max-width: 720px) {
  .project-create-wizard__steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .project-create-wizard__step {
    padding: 0.6rem;
  }

  .project-create-wizard__deliverable-option {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .project-create-wizard__deliverable-tags {
    grid-column: 2;
    justify-content: flex-start;
  }
}

@media (min-width: 760px) {
  .project-create-wizard__field-grid {
    grid-template-columns: minmax(0, 1fr) minmax(12rem, 0.42fr);
  }
}

@media (max-width: 520px) {
  .project-create-wizard__title {
    display: grid;
  }

  .project-create-wizard__actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .project-create-wizard__actions :deep(.v-spacer) {
    display: none;
  }
}
</style>
