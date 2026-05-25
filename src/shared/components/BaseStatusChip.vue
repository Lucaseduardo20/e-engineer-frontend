<script setup lang="ts">
import type { StatusTone } from '@/shared/types/status-tone.types'

defineProps<{
  label: string
  tone?: StatusTone
}>()
</script>

<template>
  <span class="base-status-chip" :class="`base-status-chip--${tone ?? 'neutral'}`">
    {{ label }}
  </span>
</template>

<style scoped>
.base-status-chip {
  display: inline-flex;
  min-height: 1.625rem;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 0.125rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.1;
  white-space: nowrap;
}

.base-status-chip--neutral {
  border-color: #d8dee6;
  background: #f5f7fa;
  color: #4b5565;
}

.base-status-chip--info {
  border-color: #b8d7ff;
  background: #eef6ff;
  color: #175cd3;
}

.base-status-chip--success {
  border-color: #b8e6c9;
  background: #edfdf3;
  color: #087443;
}

.base-status-chip--warning {
  border-color: #f6d58f;
  background: #fff7e6;
  color: #9a5b00;
}

.base-status-chip--danger {
  border-color: #f3b7b7;
  background: #fff1f1;
  color: #b42318;
}
</style>
