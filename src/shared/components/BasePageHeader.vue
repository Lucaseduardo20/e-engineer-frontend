<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  description?: string
  breadcrumbs?: string[]
}>()
</script>

<template>
  <header class="base-page-header">
    <nav v-if="breadcrumbs?.length" class="base-page-header__breadcrumbs" aria-label="Breadcrumb">
      <span v-for="(breadcrumb, index) in breadcrumbs" :key="breadcrumb">
        <span>{{ breadcrumb }}</span>
        <span v-if="index < breadcrumbs.length - 1" aria-hidden="true">/</span>
      </span>
    </nav>

    <div class="base-page-header__content">
      <div>
        <p v-if="eyebrow" class="base-page-header__eyebrow">{{ eyebrow }}</p>
        <h1>{{ title }}</h1>
        <p v-if="description" class="base-page-header__description">{{ description }}</p>
      </div>

      <div v-if="$slots.actions" class="base-page-header__actions">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.base-page-header {
  display: grid;
  gap: 0.85rem;
}

.base-page-header__breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  color: #667085;
  font-size: 0.8125rem;
  font-weight: 600;
}

.base-page-header__content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
}

.base-page-header__eyebrow {
  margin: 0 0 0.375rem;
  color: #1d6f61;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #172033;
  font-size: clamp(1.75rem, 2.4vw, 2.35rem);
  line-height: 1.08;
}

.base-page-header__description {
  max-width: 58rem;
  margin: 0.625rem 0 0;
  color: #5f6b7a;
  font-size: 1rem;
  line-height: 1.6;
}

.base-page-header__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 760px) {
  .base-page-header__content {
    display: grid;
  }

  .base-page-header__actions {
    justify-content: flex-start;
  }
}
</style>
