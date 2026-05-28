<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OrgSwitcher from '@/modules/organizations/components/OrgSwitcher.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useUiStore } from '@/modules/ui/stores/ui.store'
import { apiClient } from '@/shared/http/api-client'
import { permissions } from '@/shared/auth/rbac'
import type { Permission } from '@/shared/auth/rbac'
import { formatDateTime } from '@/shared/formatters/date.formatter'
import type { AuditLogEntry } from '@/shared/types/api-contracts'

type NavigationItem = {
  label: string
  path: string
  icon: string
  permission: Permission
}

const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: '$info', permission: permissions.dashboard.read },
  { label: 'Projetos', path: '/projects', icon: '$file', permission: permissions.projects.read },
  {
    label: 'Documentos',
    path: '/documents',
    icon: '$upload',
    permission: permissions.documents.read,
  },
  { label: 'Revisoes', path: '/reviews', icon: '$search', permission: permissions.reviews.read },
  {
    label: 'Base de Conhecimento',
    path: '/knowledge-base',
    icon: '$command',
    permission: permissions.projects.read,
  },
  {
    label: 'Organizacao',
    path: '/organizations',
    icon: '$success',
    permission: permissions.organization.read,
  },
]

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()
const notifications = ref<AuditLogEntry[]>([])
const isLoadingNotifications = ref(false)

const userName = computed(() => authStore.user?.fullName ?? 'Usuario')
const userEmail = computed(() => authStore.user?.email ?? 'Sessao ativa')
const sessionLabel = computed(() => {
  if (authStore.isImpersonating) {
    return 'Incorporando usuario'
  }

  if (authStore.isPlatformAdmin) {
    return 'Super-admin'
  }

  return null
})
const userInitials = computed(() => {
  const words = userName.value.trim().split(/\s+/).filter(Boolean)
  return words.length
    ? words
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join('')
    : 'EE'
})
const canShowBack = computed(() => route.path !== '/dashboard')
const visibleNavigationItems = computed(() =>
  navigationItems.filter((item) => authStore.can(item.permission)),
)
const userNotifications = computed(() => {
  const userId = authStore.user?.id
  const name = authStore.user?.fullName

  if (!userId && !name) {
    return notifications.value
  }

  return notifications.value.filter(
    (item) =>
      item.actorName === userId ||
      item.actorName === name ||
      item.description.includes(userId ?? '') ||
      item.description.includes(name ?? ''),
  )
})

onMounted(() => {
  void loadNotifications()
})

async function loadNotifications() {
  isLoadingNotifications.value = true

  try {
    notifications.value = (await apiClient.audit.list({ page: 1, pageSize: 30 })).items
  } finally {
    isLoadingNotifications.value = false
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }

  void router.push('/dashboard')
}
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
          v-for="item in visibleNavigationItems"
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
      <v-chip
        v-if="sessionLabel"
        class="app-shell__session-chip"
        color="warning"
        variant="tonal"
        size="small"
      >
        {{ sessionLabel }}
      </v-chip>
      <v-menu max-width="420">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon="$info"
            variant="tonal"
            color="teal"
            size="small"
            aria-label="Notificacoes"
          />
        </template>
        <v-card class="app-shell__notifications" rounded="lg">
          <v-card-title>Meus movimentos</v-card-title>
          <v-progress-linear v-if="isLoadingNotifications" indeterminate color="teal" />
          <v-list lines="three">
            <v-list-item
              v-for="notification in userNotifications"
              :key="notification.id"
              :title="notification.description"
              :subtitle="`${notification.actorName} · ${formatDateTime(notification.occurredAt)}`"
            />
            <v-list-item
              v-if="!isLoadingNotifications && userNotifications.length === 0"
              title="Sem movimentos recentes"
              subtitle="As acoes ligadas ao seu usuario aparecerao aqui."
            />
          </v-list>
        </v-card>
      </v-menu>
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
        <v-btn
          v-if="canShowBack"
          class="app-shell__back"
          color="teal"
          variant="tonal"
          prepend-icon="$prev"
          @click="goBack"
        >
          Voltar
        </v-btn>
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

.app-shell__notifications {
  border: 1px solid #d7e4df;
}

.app-shell__session-chip {
  margin-right: 0.75rem;
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

.app-shell__back {
  justify-self: start;
  margin-bottom: 0.85rem;
  border: 1px solid #8ccbbd;
  box-shadow: 0 8px 18px rgb(17 92 76 / 0.08);
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
