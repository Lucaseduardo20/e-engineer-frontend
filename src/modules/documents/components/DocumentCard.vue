<script setup lang="ts">
import { computed } from 'vue'
import BaseStatusBadge from '@/shared/components/BaseStatusBadge.vue'
import TraceableLinkButton from '@/shared/components/TraceableLinkButton.vue'
import { formatDateTime, formatShortDate } from '@/shared/formatters/date.formatter'
import type { DocumentSummary, User } from '@/shared/types/api-contracts'
import { documentBadgeKind } from '@/shared/ui/status-badges'

const props = defineProps<{
  document: DocumentSummary
  users?: User[]
  canSaveModel?: boolean
}>()

const emit = defineEmits<{
  upload: [document: DocumentSummary]
  edit: [document: DocumentSummary]
  assign: [document: DocumentSummary]
  history: [document: DocumentSummary]
  delete: [document: DocumentSummary]
  'save-model': [document: DocumentSummary]
}>()
const actions = [
  { key: 'download', label: 'Baixar', icon: '$file' },
  { key: 'upload', label: 'Nova versao', icon: '$upload' },
  ...(props.canSaveModel ? [{ key: 'save-model', label: 'Salvar como modelo', icon: '$file' }] : []),
  { key: 'history', label: 'Historico', icon: '$calendar' },
  { key: 'edit', label: 'Editar', icon: '$edit' },
  { key: 'assign', label: 'Revisores', icon: '$success' },
  { key: 'delete', label: 'Excluir', icon: '$delete' },
]
function runAction(key: string) {
  if (key === 'download') {
    if (downloadUrl.value) globalThis.open(downloadUrl.value, '_blank')
    return
  }
  if (key === 'upload') return emit('upload', props.document)
  if (key === 'save-model') return emit('save-model', props.document)
  if (key === 'history') return emit('history', props.document)
  if (key === 'edit') return emit('edit', props.document)
  if (key === 'assign') return emit('assign', props.document)
  return emit('delete', props.document)
}

const documentTypeLabels: Record<string, string> = {
  memorial_descritivo: 'Memorial descritivo',
  projeto_estrutural: 'Projeto estrutural',
  projeto_arquitetonico: 'Projeto arquitetonico',
  projeto_eletrico: 'Projeto eletrico',
  projeto_hidrossanitario: 'Projeto hidrossanitario',
  orcamento: 'Orcamento',
  cronograma: 'Cronograma',
  laudo: 'Laudo tecnico',
  relatorio_fotografico: 'Relatorio fotografico',
  art_rrt: 'ART/RRT',
  levantamento_topografico: 'Levantamento topografico',
  especificacao_tecnica: 'Especificacao tecnica',
  outro: 'Documento tecnico',
}

const revisionLabel = computed(
  () => props.document.officialRevision ?? props.document.latestVersion?.revision ?? 'Sem versao',
)
const latestVersion = computed(
  () => props.document.latestVersion ?? props.document.officialVersion ?? null,
)
const downloadUrl = computed(() => latestVersion.value?.filePath ?? '')

function userName(userId?: string | null) {
  if (!userId) {
    return 'Sem autor'
  }

  return props.users?.find((user) => user.id === userId)?.fullName ?? userId.slice(0, 8)
}
</script>

<template>
  <v-card class="document-card" variant="flat" rounded="lg">
    <div class="document-card__head">
      <span class="document-card__icon">
        <v-icon icon="$file" size="20" />
      </span>
      <div class="document-card__title">
        <h3>{{ document.title }}</h3>
        <p>{{ documentTypeLabels[document.type] ?? 'Documento tecnico' }}</p>
      </div>
      <BaseStatusBadge :kind="documentBadgeKind(document.status)" />
    </div>

    <p v-if="document.description" class="document-card__description">
      {{ document.description }}
    </p>

    <div v-if="document.tags?.length" class="document-card__tags">
      <v-chip v-for="tag in document.tags" :key="tag.id" color="teal" size="small" variant="tonal">
        {{ tag.name }}
      </v-chip>
    </div>

    <div class="document-card__meta">
      <span>
        <v-icon icon="$calendar" size="15" />
        {{ formatShortDate(document.updatedAt) }}
      </span>
      <span>
        <v-icon icon="$complete" size="15" />
        {{ revisionLabel }}
      </span>
      <span>
        <v-icon icon="$success" size="15" />
        {{ userName(latestVersion?.uploadedBy) }}
      </span>
      <span v-if="latestVersion">
        <v-icon icon="$search" size="15" />
        {{ formatDateTime(latestVersion.uploadedAt) }}
      </span>
    </div>

    <div v-if="latestVersion?.notes" class="document-card__note">
      {{ latestVersion.notes }}
    </div>

    <div class="document-card__actions">
      <TraceableLinkButton :path="`/documents?documentId=${document.id}`" label="Link" />
      <v-menu location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" size="small" color="teal" variant="tonal" prepend-icon="$edit">Acoes</v-btn>
        </template>
        <v-list min-width="240" class="document-card__menu">
          <v-list-item
            v-for="item in actions"
            :key="item.key"
            :prepend-icon="item.icon"
            :title="item.label"
            @click="runAction(item.key)"
          />
        </v-list>
      </v-menu>
    </div>
  </v-card>
</template>

<style scoped>
.document-card {
  display: grid;
  gap: 0.875rem;
  border: 1px solid #d7e4df;
  background: #ffffff;
  padding: 1rem;
  box-shadow: 0 12px 28px rgb(15 45 38 / 0.05);
}

.document-card__head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
}

.document-card__icon {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  border-radius: 0.5rem;
  background: #e8f5f0;
  color: #1d6f61;
}

.document-card__title {
  min-width: 0;
}

.document-card__title h3,
.document-card__title p,
.document-card__description,
.document-card__note {
  margin: 0;
}

.document-card__title h3 {
  overflow: hidden;
  color: #123c32;
  font-size: 1rem;
  font-weight: 850;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-card__title p,
.document-card__description,
.document-card__meta {
  color: #63716d;
  font-size: 0.84rem;
}

.document-card__description,
.document-card__note {
  line-height: 1.45;
}

.document-card__note {
  border-left: 3px solid #8ccbbd;
  background: #f5fbf9;
  color: #34443f;
  font-size: 0.84rem;
  padding: 0.625rem 0.75rem;
}

.document-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.document-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.document-card__meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.document-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
