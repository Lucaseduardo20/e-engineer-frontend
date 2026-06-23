<script setup lang="ts">
import { computed } from 'vue'
import KnowledgeItemGenericContent from './KnowledgeItemGenericContent.vue'
import type { KnowledgeItemDetail } from '@/modules/knowledge-base/types/knowledge.types'

const props = defineProps<{ item: KnowledgeItemDetail }>()
const metadata = computed(() => (props.item.content?.metadata as Record<string, unknown> | undefined) ?? {})
const sections = computed(() => Array.isArray(props.item.content?.sections) ? props.item.content?.sections as Array<Record<string, unknown>> : [])
function section(title: string) {
  const hit = sections.value.find((s) => typeof s.title === 'string' && s.title.toLowerCase().includes(title.toLowerCase()))
  return typeof hit?.body === 'string' ? hit.body : ''
}
function toProject(id: unknown) { return typeof id === 'string' && id ? `/projects/${id}` : null }
function toDocument(id: unknown) { return typeof id === 'string' && id ? `/documents?documentId=${id}` : null }
function toDocumentVersion(id: unknown) { return typeof id === 'string' && id ? `/documents?documentVersionId=${id}` : null }
function toReview(id: unknown) { return typeof id === 'string' && id ? `/reviews/${id}` : null }
</script>

<template>
  <template v-if="item.type === 'project_reference'">
    <v-sheet class="knowledge-detail__section"><h2>Projeto de origem</h2><p>Esta referencia foi criada a partir de um projeto real da organizacao.</p><p>{{ String(metadata.sourceProjectName || metadata.sourceProjectId || 'Nao informado') }}</p><v-btn v-if="toProject(metadata.sourceProjectId)" :to="toProject(metadata.sourceProjectId)!" size="small" color="teal" variant="text">Abrir projeto de origem</v-btn></v-sheet>
    <v-sheet class="knowledge-detail__section mt-4"><h2>Quando usar esta referencia</h2><p>{{ section('quando usar') || 'Nao informado.' }}</p></v-sheet>
    <v-sheet class="knowledge-detail__section mt-4"><h2>Alertas e observacoes</h2><p>{{ section('alerta') || 'Sem alertas registrados.' }}</p></v-sheet>
  </template>
  <template v-else-if="item.type === 'document_model'">
    <v-sheet class="knowledge-detail__section"><h2>Documento de origem</h2><p>Este modelo foi criado a partir de um documento tecnico existente.</p><p>{{ String(metadata.sourceDocumentTitle || metadata.sourceDocumentId || 'Nao informado') }}</p><v-btn v-if="toDocument(metadata.sourceDocumentId)" :to="toDocument(metadata.sourceDocumentId)!" size="small" color="teal" variant="text">Abrir documento de origem</v-btn><v-btn v-if="toDocumentVersion(metadata.sourceDocumentVersionId)" :to="toDocumentVersion(metadata.sourceDocumentVersionId)!" size="small" color="teal" variant="text">Abrir versao de origem</v-btn></v-sheet>
    <v-sheet class="knowledge-detail__section mt-4"><h2>Quando usar</h2><p>{{ section('quando usar') || 'Nao informado.' }}</p></v-sheet>
    <v-sheet class="knowledge-detail__section mt-4"><h2>Observacoes e cuidados</h2><p>{{ section('observ') || 'Sem observacoes registradas.' }}</p></v-sheet>
  </template>
  <template v-else-if="item.type === 'lesson_learned'">
    <v-sheet class="knowledge-detail__section"><h2>Contexto</h2><p>{{ section('contexto') || 'Nao informado.' }}</p></v-sheet>
    <v-sheet class="knowledge-detail__section mt-4"><h2>Problema identificado</h2><p>{{ section('problema') || 'Nao informado.' }}</p></v-sheet>
    <v-sheet class="knowledge-detail__section mt-4"><h2>Impacto</h2><p>{{ section('impacto') || 'Nao informado.' }}</p></v-sheet>
    <v-sheet class="knowledge-detail__section mt-4"><h2>Recomendacao</h2><p>{{ section('recomend') || 'Nao informado.' }}</p></v-sheet>
    <v-sheet class="knowledge-detail__section mt-4"><h2>Origem da licao</h2><p>Esta licao foi registrada a partir de uma revisao tecnica.</p><v-btn v-if="toReview(metadata.sourceReviewId)" :to="toReview(metadata.sourceReviewId)!" size="small" color="teal" variant="text">Abrir revisao de origem</v-btn><v-btn v-if="toProject(metadata.sourceProjectId)" :to="toProject(metadata.sourceProjectId)!" size="small" color="teal" variant="text">Abrir projeto relacionado</v-btn><v-btn v-if="toDocument(metadata.sourceDocumentId)" :to="toDocument(metadata.sourceDocumentId)!" size="small" color="teal" variant="text">Abrir documento relacionado</v-btn></v-sheet>
  </template>
  <template v-else-if="item.type === 'technical_standard'">
    <v-sheet class="knowledge-detail__section"><h2>Regra ou padrao</h2><p>{{ section('regra') || section('padrao') || String(item.content?.summary || 'Nao informado.') }}</p></v-sheet>
    <v-sheet class="knowledge-detail__section mt-4"><h2>Aplicacao</h2><p>{{ section('aplic') || section('quando seguir') || 'Nao informado.' }}</p></v-sheet>
  </template>
  <template v-else-if="item.type === 'review_checklist'">
    <v-sheet class="knowledge-detail__section">
      <h2>Itens de checklist</h2>
      <v-list density="compact">
        <v-list-item v-for="(check, idx) in (Array.isArray(item.content?.checklist) ? item.content?.checklist : [])" :key="idx">
          <v-list-item-title>{{ typeof check === 'string' ? check : (check as Record<string, unknown>).label }}</v-list-item-title>
        </v-list-item>
      </v-list>
      <p class="mt-2">{{ section('quando usar') || 'Checklist tecnico para apoiar revisoes e aprovacoes.' }}</p>
    </v-sheet>
  </template>
  <template v-else-if="item.type === 'delivery_standard'">
    <v-sheet class="knowledge-detail__section"><h2>Padrao de entrega</h2><p>{{ String(item.content?.summary || 'Nao informado.') }}</p></v-sheet>
    <v-sheet class="knowledge-detail__section mt-4"><h2>Conferencias antes da entrega</h2><p>{{ section('confer') || section('formato') || 'Nao informado.' }}</p></v-sheet>
  </template>
  <template v-else>
    <KnowledgeItemGenericContent :content="item.content" />
  </template>
</template>
