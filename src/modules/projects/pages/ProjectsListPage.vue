<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProjectsList from '@/modules/projects/components/ProjectsList.vue'
import ProjectCreateWizard from '@/modules/projects/components/ProjectCreateWizard.vue'
import { useProjectsStore } from '@/modules/projects/stores/projects.store'
import BasePageHeader from '@/shared/components/BasePageHeader.vue'
import type { Project } from '@/shared/types/api-contracts'
import type { CreateProjectRequest } from '@/shared/http/api'

const projectsStore = useProjectsStore()
const route = useRoute()
const router = useRouter()
const isCreateDialogOpen = ref(false)
const isFiltersOpen = ref(false)
const isCreating = ref(false)
const searchTerm = ref('')
const selectedStatus = ref<Project['status'] | null>(null)

const activeFiltersCount = computed(
  () => [searchTerm.value.trim(), selectedStatus.value].filter(Boolean).length,
)
const statusOptions: Array<{ title: string; value: Project['status'] }> = [
  { title: 'Rascunho', value: 'draft' },
  { title: 'Ativo', value: 'active' },
  { title: 'Pausado', value: 'paused' },
  { title: 'Concluido', value: 'completed' },
  { title: 'Arquivado', value: 'archived' },
]

onMounted(() => {
  void projectsStore.loadProjects()

  if (route.query.new === '1') {
    openCreateDialog()
  }
})

watch(
  () => route.query.new,
  (value) => {
    if (value === '1') {
      openCreateDialog()
    }
  },
)

function resetCreateForm() {
  projectsStore.projectBaseRecommendations = []
  projectsStore.similarProjectRecommendations = []
}

function openCreateDialog() {
  resetCreateForm()
  isCreateDialogOpen.value = true
}

function closeCreateDialog() {
  isCreateDialogOpen.value = false

  if (route.query.new) {
    const query = { ...route.query }
    delete query.new
    void router.replace({ query })
  }
}

function applyFilters() {
  void projectsStore.loadProjects(1, {
    name: searchTerm.value,
    status: selectedStatus.value ?? undefined,
  })
}

function clearFilters() {
  searchTerm.value = ''
  selectedStatus.value = null
  applyFilters()
}

async function handleCreateProject(payload: CreateProjectRequest) {
  isCreating.value = true

  try {
    const project = await projectsStore.createProject(payload)

    if (project) {
      closeCreateDialog()
      resetCreateForm()
    }
  } finally {
    isCreating.value = false
  }
}

async function updateProjectStatus(project: Project, status: Project['status']) {
  if (project.status === status) {
    return
  }

  await projectsStore.updateProjectStatus(project.id, status)
}
</script>

<template>
  <v-container fluid class="projects-page pa-0">
    <BasePageHeader
      eyebrow="Carteira tecnica"
      title="Projetos"
      description="Organize projetos tecnicos por status, progresso e responsaveis de entrega."
      :breadcrumbs="['Dashboard', 'Projetos']"
    >
      <template #actions>
        <v-btn color="teal" prepend-icon="$plus" @click="openCreateDialog">Novo projeto</v-btn>
      </template>
    </BasePageHeader>

    <v-alert v-if="projectsStore.error" type="error" variant="tonal">
      {{ projectsStore.error }}
    </v-alert>

    <v-sheet class="projects-page__filter-shell" border rounded="lg">
      <div class="projects-page__filter-bar">
        <v-btn
          size="small"
          variant="tonal"
          color="teal"
          prepend-icon="$search"
          @click="isFiltersOpen = !isFiltersOpen"
        >
          Filtros da tabela
        </v-btn>
        <v-chip v-if="activeFiltersCount" color="teal" variant="tonal" size="small">
          {{ activeFiltersCount }} ativo(s)
        </v-chip>
        <v-spacer />
        <v-btn
          v-if="activeFiltersCount"
          variant="text"
          :disabled="projectsStore.isLoading"
          @click="clearFilters"
        >
          Limpar
        </v-btn>
      </div>

      <v-expand-transition>
        <div v-if="isFiltersOpen" class="projects-page__filters">
          <v-text-field
            v-model="searchTerm"
            label="Buscar por nome"
            density="comfortable"
            variant="outlined"
            prepend-inner-icon="$search"
            hide-details
            clearable
            @keyup.enter="applyFilters"
            @click:clear="clearFilters"
          />
          <v-select
            v-model="selectedStatus"
            :items="statusOptions"
            label="Status"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
          />
          <div class="projects-page__filter-actions">
            <v-btn variant="outlined" :disabled="projectsStore.isLoading" @click="clearFilters">
              Limpar
            </v-btn>
            <v-btn color="teal" :loading="projectsStore.isLoading" @click="applyFilters">
              Filtrar
            </v-btn>
          </div>
        </div>
      </v-expand-transition>
    </v-sheet>

    <ProjectsList
      :projects="projectsStore.projects"
      :loading="projectsStore.isLoading"
      :page="projectsStore.page"
      :page-size="projectsStore.pageSize"
      :total="projectsStore.total"
      @update:page="projectsStore.loadProjects"
      @update:status="updateProjectStatus"
    />

    <v-dialog v-model="isCreateDialogOpen" max-width="980" scrollable>
      <ProjectCreateWizard
        :saving="isCreating"
        @cancel="closeCreateDialog"
        @create="handleCreateProject"
      />
    </v-dialog>
  </v-container>
</template>

<style scoped>
.projects-page {
  display: grid;
  gap: 1rem;
}

.projects-page__filter-shell {
  overflow: hidden;
  background: #ffffff;
}

.projects-page__filter-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
}

.projects-page__filters {
  display: grid;
  align-items: center;
  gap: 0.75rem;
  grid-template-columns: minmax(14rem, 1fr) minmax(12rem, 16rem) auto;
  border-top: 1px solid #d8e1de;
  padding: 0.875rem;
}

.projects-page__filter-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

@media (max-width: 860px) {
  .projects-page__filters {
    grid-template-columns: 1fr;
  }

  .projects-page__filter-actions {
    justify-content: flex-start;
  }
}
</style>
