<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    path: string
    label?: string
    size?: string
    icon?: string
  }>(),
  {
    label: 'Copiar link',
    size: 'x-small',
    icon: '$file',
  },
)

const copied = ref(false)
const absoluteUrl = computed(() => new URL(props.path, window.location.origin).toString())
const tooltipText = computed(() => (copied.value ? 'Link copiado' : props.label))

async function copyLink() {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(absoluteUrl.value)
  } else {
    const input = document.createElement('textarea')
    input.value = absoluteUrl.value
    input.setAttribute('readonly', '')
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
  }

  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 1600)
}
</script>

<template>
  <v-tooltip :text="tooltipText">
    <template #activator="{ props: tooltipProps }">
      <v-btn
        v-bind="tooltipProps"
        class="traceable-link-button"
        :size="size"
        :icon="copied ? '$complete' : icon"
        :color="copied ? 'green' : 'teal'"
        variant="text"
        :aria-label="tooltipText"
        @click.stop="copyLink"
      />
    </template>
  </v-tooltip>
</template>

<style scoped>
.traceable-link-button {
  opacity: 0.72;
}

.traceable-link-button:hover,
.traceable-link-button:focus-visible {
  opacity: 1;
}
</style>
