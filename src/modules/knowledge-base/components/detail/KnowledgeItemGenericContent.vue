<script setup lang="ts">
const props = defineProps<{ content?: Record<string, unknown> | null }>()
const summary = typeof props.content?.summary === 'string' ? props.content.summary : ''
const sections = Array.isArray(props.content?.sections) ? props.content?.sections as Array<Record<string, unknown>> : []
const checklist = Array.isArray(props.content?.checklist) ? props.content?.checklist as Array<Record<string, unknown> | string> : []
const metadata = props.content?.metadata && typeof props.content.metadata === 'object'
  ? Object.entries(props.content.metadata as Record<string, unknown>)
  : []
</script>

<template>
  <v-sheet class="knowledge-detail__section">
    <h2>Resumo</h2>
    <p>{{ summary || 'Sem resumo estruturado.' }}</p>
  </v-sheet>
  <v-sheet class="knowledge-detail__section mt-4">
    <h2>Conteudo tecnico</h2>
    <div v-for="(section, idx) in sections" :key="idx" class="knowledge-detail__content-block">
      <h3>{{ typeof section.title === 'string' ? section.title : 'Secao' }}</h3>
      <p>{{ typeof section.body === 'string' ? section.body : '' }}</p>
    </div>
    <div v-if="checklist.length" class="knowledge-detail__content-block">
      <h3>Checklist</h3>
      <v-list density="compact">
        <v-list-item v-for="(item, idx) in checklist" :key="idx">
          <v-list-item-title>{{ typeof item === 'string' ? item : item.label }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </div>
    <div v-if="metadata.length" class="knowledge-detail__content-block">
      <h3>Metadados</h3>
      <v-table density="compact"><tbody><tr v-for="[k, v] in metadata" :key="k"><td class="metadata-key">{{ k }}</td><td>{{ String(v) }}</td></tr></tbody></v-table>
    </div>
  </v-sheet>
</template>

