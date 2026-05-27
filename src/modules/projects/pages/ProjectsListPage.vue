<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ProjectsList from '@/modules/projects/components/ProjectsList.vue'
import { useProjectsStore } from '@/modules/projects/stores/projects.store'

const projectsStore = useProjectsStore()
const isCreateDialogOpen = ref(false)
const projectName = ref('')
const projectType = ref('')
const isCreating = ref(false)

const projectTypes = [
  'reforma escolar',
  'drenagem urbana',
  'pavimentacao',
  'unidade de saude',
  'validacao tecnica',
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
  <v-container fluid class="pa-0">
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
      <div>
        <p class="text-overline text-medium-emphasis mb-1">Carteira tecnica</p>
        <h1 class="text-h5">Projetos</h1>
      </div>
      <v-btn color="teal" prepend-icon="$plus" @click="openCreateDialog">Novo projeto</v-btn>
    </div>

    <v-alert v-if="projectsStore.error" type="error" variant="tonal" class="mb-4">
      {{ projectsStore.error }}
    </v-alert>

    <ProjectsList :projects="projectsStore.projects" :loading="projectsStore.isLoading" />

    <v-dialog v-model="isCreateDialogOpen" max-width="520">
      <v-card>
        <v-card-title>Novo projeto tecnico</v-card-title>
        <v-card-text class="d-grid ga-4">
          <v-text-field
            v-model="projectName"
            label="Nome do projeto"
            maxlength="160"
            variant="outlined"
            autofocus
          />
          <v-select
            v-model="projectType"
            :items="projectTypes"
            label="Tipo de projeto"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="isCreateDialogOpen = false">Cancelar</v-btn>
          <v-btn
            color="teal"
            :disabled="!projectName.trim() || !projectType.trim()"
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
