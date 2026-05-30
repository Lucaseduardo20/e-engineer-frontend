<script setup lang="ts">
import { computed } from 'vue'
import { formatDateTime } from '@/shared/formatters/date.formatter'
import {
  knowledgeStatusLabels,
  knowledgeTypeLabels,
  type KnowledgeItemDetail,
} from '@/modules/knowledge-base/types/knowledge.types'

const props = defineProps<{
  item: KnowledgeItemDetail | null
  loading?: boolean
}>()

const typeGuidance = computed(() => {
  if (!props.item) return ''

  if (props.item.type === 'technical_standard') {
    return 'Este padrao orienta como a organizacao deve executar ou validar uma pratica tecnica.'
  }

  if (props.item.type === 'document_model') {
    return 'Este item serve como referencia para criacao de documentos tecnicos semelhantes.'
  }

  if (props.item.type === 'project_reference') {
    return 'Este projeto pode ser usado como base ou inspiracao para novos projetos semelhantes.'
  }

  if (props.item.type === 'lesson_learned') {
    return 'Este aprendizado registra um problema, decisao ou retrabalho que deve orientar projetos futuros.'
  }

  if (props.item.type === 'review_checklist') {
    return 'Use este checklist para revisar entregaveis antes de aprovar ou enviar.'
  }

  return 'Este padrao define como organizar e entregar um pacote tecnico.'
})

const summary = computed(() => {
  const value = props.item?.content?.summary
  return typeof value === 'string' ? value : ''
})

const sections = computed(() => {
  const value = props.item?.content?.sections

  if (!Array.isArray(value)) return []

  return value
    .map((section) => {
      if (!section || typeof section !== 'object') return null
      const title = typeof (section as Record<string, unknown>).title === 'string'
        ? String((section as Record<string, unknown>).title)
        : ''
      const body = typeof (section as Record<string, unknown>).body === 'string'
        ? String((section as Record<string, unknown>).body)
        : ''

      if (!title && !body) return null

      return { title, body }
    })
    .filter(Boolean) as Array<{ title: string; body: string }>
})

const checklistItems = computed(() => {
  const value = props.item?.content?.checklist
  if (!Array.isArray(value)) return []

  return value
    .map((raw) => {
      if (typeof raw === 'string') {
        return { label: raw, required: false }
      }

      if (!raw || typeof raw !== 'object') return null

      const record = raw as Record<string, unknown>
      const label = typeof record.label === 'string' ? record.label : ''
      const required = typeof record.required === 'boolean' ? record.required : false

      if (!label) return null
      return { label, required }
    })
    .filter(Boolean) as Array<{ label: string; required: boolean }>
})

const metadataEntries = computed(() => {
  const value = props.item?.content?.metadata
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []

  return Object.entries(value).map(([key, item]) => ({
    key,
    value:
      typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
        ? String(item)
        : JSON.stringify(item),
  }))
})

const contentHasAnyData = computed(
  () => !!summary.value || sections.value.length > 0 || checklistItems.value.length > 0 || metadataEntries.value.length > 0,
)
</script>

<template>
  <v-progress-linear v-if="loading" indeterminate color="teal" />

  <section v-else-if="item" class="knowledge-detail">
    <div class="knowledge-detail__header">
      <div>
        <div class="knowledge-detail__chips">
          <v-chip color="teal" variant="tonal">{{ knowledgeTypeLabels[item.type] }}</v-chip>
          <v-chip class="ml-2" color="blue-grey" variant="tonal">
            {{ knowledgeStatusLabels[item.status] }}
          </v-chip>
        </div>
        <h1>{{ item.title }}</h1>
        <p class="knowledge-detail__subtitle">
          {{ item.description || 'Sem descricao registrada.' }}
        </p>
        <v-alert type="info" variant="tonal" density="comfortable" class="mt-3">
          {{ typeGuidance }}
        </v-alert>
      </div>
    </div>

    <v-alert
      v-if="item.status === 'archived'"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      Este item esta arquivado e nao aparece nas buscas principais por padrao.
    </v-alert>

    <v-alert
      v-if="item.status === 'deprecated'"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      Este item esta obsoleto e nao e recomendado para novos projetos. Ele permanece disponivel apenas como historico.
    </v-alert>

    <v-row>
      <v-col cols="12" md="8">
        <v-sheet class="knowledge-detail__section">
          <h2>Resumo</h2>
          <p v-if="summary">{{ summary }}</p>
          <p v-else>Sem resumo estruturado.</p>
        </v-sheet>

        <v-sheet class="knowledge-detail__section mt-4">
          <h2>Conteudo tecnico</h2>
          <template v-if="contentHasAnyData">
            <div v-for="(section, index) in sections" :key="`${section.title}-${index}`" class="knowledge-detail__content-block">
              <h3>{{ section.title || 'Secao' }}</h3>
              <p>{{ section.body }}</p>
            </div>

            <div v-if="checklistItems.length" class="knowledge-detail__content-block">
              <h3>Checklist</h3>
              <v-list density="compact">
                <v-list-item v-for="(check, index) in checklistItems" :key="`${check.label}-${index}`">
                  <template #prepend>
                    <v-icon icon="$file" size="16" color="teal" />
                  </template>
                  <v-list-item-title>
                    {{ check.label }}
                    <v-chip v-if="check.required" size="x-small" class="ml-2" color="teal" variant="outlined">
                      obrigatorio
                    </v-chip>
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </div>

            <div v-if="metadataEntries.length" class="knowledge-detail__content-block">
              <h3>Metadados</h3>
              <v-table density="compact">
                <tbody>
                  <tr v-for="entry in metadataEntries" :key="entry.key">
                    <td class="metadata-key">{{ entry.key }}</td>
                    <td>{{ entry.value }}</td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </template>

          <p v-else>Sem conteudo estruturado registrado.</p>
        </v-sheet>
      </v-col>

      <v-col cols="12" md="4">
        <v-sheet class="knowledge-detail__section">
          <h2>Tags e contexto</h2>
          <p class="muted">Tags ajudam a encontrar e recomendar este conhecimento em novos projetos.</p>
          <div class="knowledge-detail__tags">
            <v-chip v-for="tag in item.tags" :key="tag" size="small" variant="tonal">{{ tag }}</v-chip>
          </div>
        </v-sheet>

        <v-sheet class="knowledge-detail__section mt-4">
          <h2>Relacoes</h2>
          <p class="muted">Projetos relacionados</p>
          <p class="placeholder">Ainda nenhum projeto vinculado a este item.</p>
          <p class="muted mt-2">Documentos relacionados</p>
          <p class="placeholder">Ainda nenhum documento vinculado a este item.</p>
          <p class="muted mt-2">Revisoes relacionadas</p>
          <p class="placeholder">Ainda nenhuma revisao vinculada a este item.</p>
        </v-sheet>

        <v-sheet class="knowledge-detail__section mt-4">
          <h2>Historico</h2>
          <p>Criado por {{ item.createdBy }}</p>
          <p>Criado em {{ formatDateTime(item.createdAt) }}</p>
          <p>Atualizado em {{ formatDateTime(item.updatedAt) }}</p>
          <p v-if="item.publishedAt">Publicado em {{ formatDateTime(item.publishedAt) }}</p>
          <p v-if="item.archivedAt">Arquivado em {{ formatDateTime(item.archivedAt) }}</p>
          <p v-if="item.deprecatedAt">Marcado como obsoleto em {{ formatDateTime(item.deprecatedAt) }}</p>
        </v-sheet>
      </v-col>
    </v-row>
  </section>
</template>

<style scoped>
.knowledge-detail__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.knowledge-detail h1 {
  margin: 0.75rem 0 0.35rem;
  color: #15231f;
  font-size: 1.8rem;
}

.knowledge-detail__subtitle {
  color: #53625d;
}

.knowledge-detail__chips,
.knowledge-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.knowledge-detail__section {
  border: 1px solid #d7e4df;
  border-radius: 0.5rem;
  padding: 1rem;
}

.knowledge-detail__section h2 {
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.knowledge-detail__content-block + .knowledge-detail__content-block {
  margin-top: 1rem;
}

.muted {
  color: #64736f;
  font-size: 0.85rem;
}

.placeholder {
  color: #53625d;
  font-size: 0.9rem;
}

.metadata-key {
  width: 35%;
  color: #42524d;
  font-weight: 600;
}
</style>
