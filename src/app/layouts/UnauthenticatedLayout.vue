<template>
  <main class="unauthenticated-layout">
    <slot />
  </main>
</template>

<style scoped>
.unauthenticated-layout {
  display: grid;
  min-height: 100vh;
  background:
    linear-gradient(90deg, rgb(16 35 31 / 0.96), rgb(16 35 31 / 0.78)),
    #f3f5f4;
}
</style>

