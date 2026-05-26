<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import OrgSwitcher from '@/modules/organizations/components/OrgSwitcher.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useUiStore } from '@/modules/ui/stores/ui.store'

type NavigationItem = {
  label: string
  path: string
  icon: string
}

const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: '$info' },
  { label: 'Projetos', path: '/projects', icon: '$file' },
  { label: 'Documentos', path: '/documents', icon: '$upload' },
  { label: 'Revisoes', path: '/reviews', icon: '$search' },
  { label: 'Base de Conhecimento', path: '/knowledge-base', icon: '$command' },
  { label: 'Equipe', path: '/team', icon: '$success' },
]

const route = useRoute()
const authStore = useAuthStore()
const uiStore = useUiStore()

const userName = computed(() => authStore.user?.fullName ?? 'Usuario')
const userEmail = computed(() => authStore.user?.email ?? 'Sessao ativa')
const userInitials = computed(() => {
  const words = userName.value.trim().split(/\s+/).filter(Boolean)
  return words.length
    ? words
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join('')
    : 'EE'
})
</script>

<template>
  <v-app>
    <v-navigation-drawer
      :rail="uiStore.isNavigationCollapsed"
      permanent
      width="280"
      color="#10231f"
      theme="dark"
    >
      <div class="app-shell__brand">
        <span class="app-shell__brand-mark">EE</span>
        <span v-if="!uiStore.isNavigationCollapsed">
          <strong>E-Engineer</strong>
          <small>Controle tecnico</small>
        </span>
      </div>

      <v-list nav density="comfortable" aria-label="Navegacao principal">
        <v-list-item
          v-for="item in navigationItems"
          :key="item.path"
          :to="item.path"
          :active="route.path === item.path"
          :prepend-icon="item.icon"
          rounded="lg"
          :title="item.label"
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="white" elevation="0" border>
      <v-tooltip :text="uiStore.isNavigationCollapsed ? 'Expandir menu' : 'Recolher menu'">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            :icon="uiStore.isNavigationCollapsed ? '$next' : '$prev'"
            variant="tonal"
            color="teal"
            size="small"
            aria-label="Alternar menu"
            @click="uiStore.toggleNavigation"
          />
        </template>
      </v-tooltip>
      <div class="app-shell__org"><OrgSwitcher /></div>
      <v-spacer />
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text" class="app-shell__account">
            <v-avatar color="teal" variant="tonal" size="32">{{ userInitials }}</v-avatar>
            <span class="app-shell__account-copy">
              <strong>{{ userName }}</strong>
              <small>{{ userEmail }}</small>
            </span>
          </v-btn>
        </template>
        <v-list>
          <v-list-item to="/logout" title="Sair" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <div class="app-shell__main">
        <slot />
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
.app-shell__brand {
  display: flex;
  min-height: 4.5rem;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
}

.app-shell__brand-mark {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  border-radius: 0.5rem;
  background: #d7f2e7;
  color: #143d33;
  font-weight: 900;
}

.app-shell__brand strong,
.app-shell__brand small,
.app-shell__account-copy strong,
.app-shell__account-copy small {
  display: block;
}

.app-shell__brand small,
.app-shell__account-copy small {
  font-size: 0.75rem;
  opacity: 0.72;
}

.app-shell__org {
  width: min(22rem, 42vw);
  margin-left: 1rem;
}

.app-shell__account {
  min-height: 3rem;
}

.app-shell__account-copy {
  margin-left: 0.5rem;
  text-align: left;
}

.app-shell__main {
  width: min(100%, 92rem);
  margin: 0 auto;
  padding: 1.5rem;
}

@media (max-width: 720px) {
  .app-shell__org {
    display: none;
  }

  .app-shell__account-copy {
    display: none;
  }

  .app-shell__main {
    padding: 1rem;
  }
}
</style>
