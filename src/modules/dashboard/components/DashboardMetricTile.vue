<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  hint: string
  icon: string
  color: string
  trend?: number
  chart?: number[]
}>()
</script>

<template>
  <v-card class="metric-tile" variant="flat" rounded="lg">
    <v-card-text>
      <div class="metric-tile__topline">
        <span class="metric-tile__icon" :style="{ color }">
          <v-icon :icon="icon" size="22" />
        </span>
        <v-chip v-if="trend !== undefined" size="x-small" color="teal" variant="tonal">
          {{ trend >= 0 ? '+' : '' }}{{ trend }}%
        </v-chip>
      </div>

      <p class="metric-tile__label">{{ label }}</p>
      <div class="metric-tile__value">{{ value }}</div>

      <div v-if="chart?.length" class="metric-tile__chart" aria-hidden="true">
        <span
          v-for="(point, index) in chart"
          :key="index"
          :style="{ height: `${Math.max(18, point)}%`, backgroundColor: color }"
        />
      </div>

      <p class="metric-tile__hint">{{ hint }}</p>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.metric-tile {
  border: 1px solid #d7e4df;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbfa 100%);
  box-shadow: 0 12px 28px rgb(15 45 38 / 0.07);
}

.metric-tile__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.metric-tile__icon {
  display: grid;
  width: 2.375rem;
  height: 2.375rem;
  place-items: center;
  border: 1px solid currentColor;
  border-radius: 0.5rem;
  background: color-mix(in srgb, currentColor 10%, white);
}

.metric-tile__label {
  margin: 1rem 0 0;
  color: #51615d;
  font-size: 0.875rem;
  font-weight: 700;
}

.metric-tile__value {
  margin-top: 0.15rem;
  color: #14231f;
  font-size: 2rem;
  font-weight: 850;
  line-height: 1.1;
}

.metric-tile__chart {
  display: flex;
  height: 3rem;
  align-items: end;
  gap: 0.35rem;
  margin-top: 1rem;
}

.metric-tile__chart span {
  width: 100%;
  min-width: 0.45rem;
  border-radius: 0.4rem 0.4rem 0.15rem 0.15rem;
  opacity: 0.72;
}

.metric-tile__hint {
  margin: 0.8rem 0 0;
  color: #62716d;
  font-size: 0.8rem;
}
</style>
