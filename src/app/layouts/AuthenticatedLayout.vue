<script setup lang="ts">
type NavigationItem = {
  label: string
  path: string
  active?: boolean
  disabled?: boolean
}

const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', path: '/dashboard', active: true },
  { label: 'Projetos', path: '/projects', disabled: true },
  { label: 'Templates', path: '/templates', disabled: true },
  { label: 'Documentos', path: '/documents', disabled: true },
  { label: 'Revisoes', path: '/reviews', disabled: true },
  { label: 'Base de Conhecimento', path: '/knowledge-base', disabled: true },
  { label: 'Equipe', path: '/team', disabled: true },
  { label: 'Configuracoes', path: '/settings', disabled: true },
]
</script>

<template>
  <div class="authenticated-layout">
    <aside class="authenticated-layout__sidebar" aria-label="Navegacao principal">
      <RouterLink class="authenticated-layout__brand" to="/dashboard" aria-label="E-Engineer Dashboard">
        <span class="authenticated-layout__brand-mark">EE</span>
        <span>
          <strong>E-Engineer</strong>
          <small>Controle tecnico</small>
        </span>
      </RouterLink>

      <nav class="authenticated-layout__nav">
        <template v-for="item in navigationItems" :key="item.label">
          <span
            v-if="item.disabled"
            class="authenticated-layout__nav-item authenticated-layout__nav-item--disabled"
            aria-disabled="true"
          >
            {{ item.label }}
          </span>

          <RouterLink
            v-else
            class="authenticated-layout__nav-item"
            :class="{
              'authenticated-layout__nav-item--active': item.active,
            }"
            :to="item.path"
          >
            {{ item.label }}
          </RouterLink>
        </template>
      </nav>
    </aside>

    <div class="authenticated-layout__body">
      <header class="authenticated-layout__topbar">
        <div>
          <span class="authenticated-layout__topbar-label">Organizacao atual</span>
          <strong>Engenharia Municipal Alfa</strong>
        </div>

        <div class="authenticated-layout__user">
          <span>LT</span>
          <div>
            <strong>Lucas Torres</strong>
            <small>Coordenador tecnico</small>
          </div>
        </div>
      </header>

      <main class="authenticated-layout__main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.authenticated-layout {
  display: grid;
  min-height: 100vh;
  grid-template-columns: 17.5rem minmax(0, 1fr);
  background: #f3f5f4;
}

.authenticated-layout__sidebar {
  position: sticky;
  top: 0;
  display: flex;
  height: 100vh;
  flex-direction: column;
  border-right: 1px solid #d9e0e6;
  background: #10231f;
  color: #f6fbf8;
  padding: 1.25rem;
}

.authenticated-layout__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: inherit;
  text-decoration: none;
}

.authenticated-layout__brand-mark {
  display: grid;
  width: 2.625rem;
  height: 2.625rem;
  place-items: center;
  border-radius: 0.5rem;
  background: #d7f2e7;
  color: #143d33;
  font-weight: 900;
}

.authenticated-layout__brand strong,
.authenticated-layout__user strong,
.authenticated-layout__topbar strong {
  display: block;
}

.authenticated-layout__brand small,
.authenticated-layout__user small {
  color: #b9cac5;
  font-size: 0.75rem;
}

.authenticated-layout__nav {
  display: grid;
  gap: 0.25rem;
  margin-top: 2rem;
}

.authenticated-layout__nav-item {
  border-radius: 0.5rem;
  color: #dce8e3;
  font-weight: 700;
  padding: 0.75rem 0.875rem;
  text-decoration: none;
}

.authenticated-layout__nav-item:hover {
  background: rgb(255 255 255 / 0.08);
}

.authenticated-layout__nav-item--active {
  background: #e8f8f0;
  color: #123c32;
}

.authenticated-layout__nav-item--disabled {
  color: #8aa098;
  cursor: not-allowed;
}

.authenticated-layout__body {
  display: grid;
  min-width: 0;
  grid-template-rows: auto 1fr;
}

.authenticated-layout__topbar {
  display: flex;
  min-height: 4.5rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid #d9e0e6;
  background: rgb(255 255 255 / 0.92);
  padding: 0.875rem 1.75rem;
}

.authenticated-layout__topbar-label {
  display: block;
  color: #697586;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}

.authenticated-layout__user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.authenticated-layout__user > span {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  border-radius: 50%;
  background: #2447a8;
  color: #ffffff;
  font-weight: 900;
}

.authenticated-layout__user small {
  color: #667085;
}

.authenticated-layout__main {
  width: min(100%, 92rem);
  margin: 0 auto;
  padding: 2rem;
}

@media (max-width: 980px) {
  .authenticated-layout {
    grid-template-columns: 1fr;
  }

  .authenticated-layout__sidebar {
    position: static;
    height: auto;
  }

  .authenticated-layout__nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .authenticated-layout__topbar,
  .authenticated-layout__user {
    align-items: flex-start;
  }

  .authenticated-layout__topbar {
    display: grid;
    padding: 1rem;
  }

  .authenticated-layout__main {
    padding: 1rem;
  }

  .authenticated-layout__nav {
    grid-template-columns: 1fr;
  }
}
</style>
