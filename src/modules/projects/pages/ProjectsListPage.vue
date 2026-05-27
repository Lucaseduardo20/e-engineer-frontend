<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ProjectsList from '@/modules/projects/components/ProjectsList.vue'
import { useProjectsStore } from '@/modules/projects/stores/projects.store'
import BasePageHeader from '@/shared/components/BasePageHeader.vue'
import type { Project } from '@/shared/types/api-contracts'

const projectsStore = useProjectsStore()
const isCreateDialogOpen = ref(false)
const projectName = ref('')
const projectType = ref('')
const isCreating = ref(false)
const searchTerm = ref('')
const selectedStatus = ref<Project['status'] | null>(null)

const projectTypes = [
  'reforma escolar',
  'drenagem urbana',
  'pavimentacao',
  'unidade de saude',
  'validacao tecnica',
]
const canCreateProject = computed(() =>
  Boolean(projectName.value.trim() && projectType.value.trim()),
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
})

function resetCreateForm() {
  projectName.value = ''
  projectType.value = ''
}

function openCreateDialog() {
  resetCreateForm()
  isCreateDialogOpen.value = true
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

async function handleCreateProject() {
  if (!projectName.value.trim() || !projectType.value.trim()) {
    return
  }

  isCreating.value = true

  try {
    const project = await projectsStore.createProject({
      name: projectName.value.trim(),
      projectType: projectType.value.trim(),
    })

    if (project) {
      isCreateDialogOpen.value = false
      resetCreateForm()
    }
  } finally {
    isCreating.value = false
  }
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

    <v-sheet class="projects-page__filters" border rounded="lg">
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
    </v-sheet>

    <ProjectsList
      :projects="projectsStore.projects"
      :loading="projectsStore.isLoading"
      :page="projectsStore.page"
      :page-size="projectsStore.pageSize"
      :total="projectsStore.total"
      @update:page="projectsStore.loadProjects"
    />

    <v-dialog v-model="isCreateDialogOpen" max-width="560">
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon icon="$plus" color="teal" size="20" />
          Novo projeto tecnico
        </v-card-title>
        <v-divider />
        <v-card-text class="d-grid ga-4">
          <v-text-field
            v-model="projectName"
            label="Nome do projeto"
            maxlength="160"
            counter
            variant="outlined"
            :disabled="isCreating"
            :rules="[(value: string) => Boolean(value?.trim()) || 'Informe o nome do projeto.']"
            autofocus
          />
          <v-select
            v-model="projectType"
            :items="projectTypes"
            label="Tipo de projeto"
            variant="outlined"
            :disabled="isCreating"
            :rules="[(value: string) => Boolean(value?.trim()) || 'Selecione o tipo de projeto.']"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="isCreating" @click="isCreateDialogOpen = false">
            Cancelar
          </v-btn>
          <v-btn
            color="teal"
            :disabled="!canCreateProject"
            :loading="isCreating"
            @click="handleCreateProject"
          >
            Criar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.projects-page {
  display: grid;
  gap: 1rem;
}

.projects-page__filters {
  display: grid;
  align-items: center;
  gap: 0.75rem;
  grid-template-columns: minmax(14rem, 1fr) minmax(12rem, 16rem) auto;
  background: #ffffff;
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
