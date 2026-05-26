<script setup lang="ts">
import { computed } from 'vue'
import { getStatusBadge, type StatusBadgeKind } from '@/shared/ui/status-badges'

const props = withDefaults(
  defineProps<{
    kind: StatusBadgeKind
    size?: 'x-small' | 'small' | 'default'
  }>(),
  {
    size: 'small',
  },
)

const badge = computed(() => getStatusBadge(props.kind))
</script>

<template>
  <v-chip
    :color="badge.color"
    :size="size"
    :variant="badge.tone === 'solid' ? 'flat' : 'tonal'"
    class="base-status-badge"
  >
    <v-icon :icon="badge.icon" size="14" start />
    {{ badge.label }}
  </v-chip>
</template>

<style scoped>
.base-status-badge {
  font-weight: 750;
  letter-spacing: 0;
}
</style>
