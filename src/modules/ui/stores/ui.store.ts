import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  const isNavigationCollapsed = ref(false)
  const notificationsOpen = ref(false)

  function toggleNavigation() {
    isNavigationCollapsed.value = !isNavigationCollapsed.value
  }

  function toggleNotifications() {
    notificationsOpen.value = !notificationsOpen.value
  }

  return {
    isNavigationCollapsed,
    notificationsOpen,
    toggleNavigation,
    toggleNotifications,
  }
})
