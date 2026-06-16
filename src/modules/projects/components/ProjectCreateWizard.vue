<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import TechnicalTagSelector from '@/modules/technical-taxonomy/components/TechnicalTagSelector.vue'
import { useProjectsStore } from '@/modules/projects/stores/projects.store'
import type { ProjectBaseRecommendation } from '@/shared/types/api-contracts'
import type { CreateProjectRequest } from '@/shared/http/api'

const props = defineProps<{
  saving?: boolean
}>()
const emit = defineEmits<{
  create: [payload: CreateProjectRequest]
  cancel: []
}>()

const projectsStore = useProjectsStore()
const step = ref(1)
const projectName = ref('')
const tagIds = ref<string[]>([])
const selectedBaseId = ref<string | null>(null)
const isLoadingRecommendations = ref(false)
let recommendationTimeout: ReturnType<typeof setTimeout> | undefined

const recommendations = computed(() => projectsStore.projectBaseRecommendations)
const selectedBase = computed<ProjectBaseRecommendation | null>(
  () => recommendations.value.find((item) => item.project.id === selectedBaseId.value) ?? null,
)
const canGoNext = computed(() => {
  if (step.value === 1) return Boolean(projectName.value.trim())
  if (step.value === 2) return tagIds.value.length > 0
  return true
})
const finalProjectType = computed(
  () => selectedBase.value?.project.projectType || 'projeto tecnico',
)
const structureSummary = computed(() => {
  const base = selectedBase.value
  if (!base) return 'Projeto criado do zero, com tags para guiar recomendacoes futuras.'

  return `${base.deliverablesPreview.length} entregavel(is) em preview, ${base.documentsPreview.length} documento(s) em preview e ${base.reviewsCount} revisao(oes) herdadas sem responsaveis.`
})

watch(
  tagIds,
  (ids) => {
    selectedBaseId.value = null
    if (recommendationTimeout) clearTimeout(recommendationTimeout)
    if (!ids.length) {
      projectsStore.projectBaseRecommendations = []
      return
    }
    recommendationTimeout = setTimeout(async () => {
      isLoadingRecommendations.value = true
      try {
        await projectsStore.recommendProjectBases(ids)
      } finally {
        isLoadingRecommendations.value = false
      }
    }, 250)
  },
  { deep: true },
)

function nextStep() {
  if (!canGoNext.value) return
  step.value = Math.min(step.value + 1, 4)
}

function previousStep() {
  step.value = Math.max(step.value - 1, 1)
}

function submit() {
  if (!projectName.value.trim()) return

  emit('create', {
    name: projectName.value.trim(),
    projectType: finalProjectType.value,
    tagIds: tagIds.value,
    baseProjectId: selectedBase.value?.project.id,
  })
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
            { value: 1, label: 'Nome' },
            { value: 2, label: 'Tags' },
            { value: 3, label: 'Base' },
            { value: 4, label: 'Revisao' },
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
          <p>Informe apenas o nome agora. O tipo tecnico sera inferido pela base escolhida ou criado como projeto tecnico geral.</p>
        </v-sheet>
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
      </section>

      <section v-else-if="step === 2" class="project-create-wizard__panel">
        <v-sheet border rounded="lg" class="project-create-wizard__hero">
          <span>Passo 2</span>
          <h3>Escolha as tags que descrevem o raciocinio tecnico.</h3>
          <p>As tags governadas acionam recomendacoes de projetos base do mesmo tenant.</p>
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
          <h3>Escolha um projeto base para ganhar tempo.</h3>
          <p>A base importa entregaveis, documentos com versoes/arquivos e revisoes sem responsaveis.</p>
        </v-sheet>
        <v-progress-linear v-if="isLoadingRecommendations" indeterminate color="teal" />
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
              <v-chip color="teal" variant="tonal" size="small">{{ recommendation.score }} pts</v-chip>
            </div>
            <p>{{ recommendation.deliverablesPreview.length }} entregavel(is), {{ recommendation.documentsPreview.length }} documento(s) e {{ recommendation.reviewsCount }} revisao(oes) em preview.</p>
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
            <small>Responsaveis e revisores nao serao importados.</small>
          </v-sheet>
        </div>
        <v-empty-state
          v-else-if="!isLoadingRecommendations"
          headline="Nenhum projeto base encontrado"
          text="Voce ainda pode criar do zero. As tags ficarao como contexto para recomendacoes futuras."
        />
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
        <v-alert type="info" variant="tonal">
          Documentos, versoes, arquivos e revisoes serao herdados da base selecionada. Entregaveis, revisoes e documentos ficam sem novos responsaveis atribuídos para voce redistribuir depois.
        </v-alert>
      </section>
    </v-card-text>

    <v-card-actions class="project-create-wizard__actions">
      <v-btn variant="text" :disabled="saving" @click="step === 1 ? emit('cancel') : previousStep()">
        {{ step === 1 ? 'Cancelar' : 'Voltar' }}
      </v-btn>
      <v-spacer />
      <v-btn v-if="step < 4" color="teal" :disabled="!canGoNext || saving" @click="nextStep">
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

.project-create-wizard__hero span,
.project-create-wizard__review-card span {
  color: #267365;
}

.project-create-wizard__hero p,
.project-create-wizard__review-card p,
.project-create-wizard__base-card p,
.project-create-wizard__base-card small,
.project-create-wizard__base-head span {
  margin: 0;
  color: #60716b;
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

.project-create-wizard__actions {
  padding: 0.85rem 1.25rem 1.15rem;
}

@media (max-width: 720px) {
  .project-create-wizard__steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
