<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { createKalkulationApi } from './services/kalkulationApi'
import { appConfig } from './config/appConfig'

const navigationItems = [
  { to: '/projekte', name: 'projekte', label: 'Projekte', icon: 'pi pi-folder' },
  { to: '/stammdaten', name: 'stammdaten', label: 'Kunden', icon: 'pi pi-users' }
]

const api = createKalkulationApi()
const route = useRoute()
const isNavigationOpen = ref(false)
const isContentReady = ref(false)
const appDisplayName = appConfig.displayName

const toggleNavigation = () => {
  isNavigationOpen.value = !isNavigationOpen.value
}

const closeNavigation = () => {
  isNavigationOpen.value = false
}

const getRouteDataName = () => route.name ?? 'projekte'

const prefetchRouteData = (routeName) => {
  return api.prefetchRouteData(routeName)
}

const prefetchSecondaryViews = () => {
  api.prefetchRouteData('stammdaten')
  api.prefetchRouteData('projekte')
  api.prefetchRouteData('projektEditor')
}

const waitForPaint = () =>
  new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve)
    })
  })

const removeInitialCover = async () => {
  await nextTick()
  await waitForPaint()
  document.getElementById('app-initial-cover')?.remove()
}

const loadInitialRouteData = async () => {
  try {
    await prefetchRouteData(getRouteDataName())
  } finally {
    isContentReady.value = true
  }
}

onMounted(async () => {
  await removeInitialCover()
  await loadInitialRouteData()

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(prefetchSecondaryViews, { timeout: 1200 })
    return
  }

  window.setTimeout(prefetchSecondaryViews, 300)
})
</script>

<template>
  <div class="app-shell min-vh-100">
    <nav class="topbar navbar navbar-expand-lg" aria-label="Hauptnavigation">
      <div class="container-fluid topbar-container px-3">
        <span class="navbar-brand app-brand mb-0">
          {{ appDisplayName }}
        </span>

        <button
          class="navbar-toggler border-0 shadow-none px-1"
          type="button"
          :aria-expanded="isNavigationOpen"
          aria-label="Navigation einblenden"
          @click="toggleNavigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div
          class="collapse navbar-collapse topbar-collapse"
          :class="{ show: isNavigationOpen }"
        >
          <ul class="nav app-nav mx-lg-auto mb-3 mb-lg-0">
            <li
              v-for="item in navigationItems"
              :key="item.to"
              class="nav-item"
            >
              <RouterLink
                class="nav-link app-nav-link"
                :to="item.to"
                exact-active-class="active"
                @focus="prefetchRouteData(item.name)"
                @pointerenter="prefetchRouteData(item.name)"
                @touchstart.passive="prefetchRouteData(item.name)"
                @click="closeNavigation"
              >
                <i :class="['nav-icon', item.icon]" aria-hidden="true"></i>
                {{ item.label }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <div class="d-flex topbar-actions justify-content-end">
          <div
            class="topbar-user-status"
            aria-label="Angemeldet als Demo Verkäufer"
            title="Angemeldet als Demo Verkäufer"
          >
            <span class="topbar-user-avatar" aria-hidden="true">DV</span>
            <span class="topbar-user-name">Demo Verkäufer</span>
          </div>
        </div>
      </div>
    </nav>

    <main class="container-fluid app-content" aria-label="Hauptinhalt">
      <RouterView v-slot="{ Component }">
        <Transition name="app-content-fade">
          <component :is="Component" v-if="isContentReady" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.app-content {
  min-height: calc(100vh - 4rem);
  padding: 0;
  background: var(--kt-color-bg-white);
}

.app-content-fade-enter-active {
  transition: opacity 0.18s ease;
}

.app-content-fade-enter-from {
  opacity: 0;
}

.topbar {
  background: var(--kt-color-bg-white);
  border-bottom: 1px solid var(--kt-color-border-light);
  padding: 0;
}

.topbar-container {
  align-items: center;
  min-height: 4rem;
  padding-top: 0;
  padding-bottom: 0;
}

.app-brand {
  display: inline-flex;
  align-items: center;
  color: var(--kt-color-text-primary);
  font-size: var(--kt-font-size-lg);
  font-weight: 600;
  letter-spacing: 0;
  line-height: var(--kt-line-height-tight);
}

.topbar-actions {
  flex: 1 1 0;
}

.topbar-collapse {
  height: 100%;
  align-items: stretch;
}

.topbar-actions {
  align-items: center;
}

.topbar-user-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 2.25rem;
  max-width: 100%;
  padding: 0.25rem 0;
  color: var(--kt-color-text-secondary);
  font-size: var(--kt-font-size-sm);
  font-weight: 500;
  line-height: var(--kt-line-height-tight);
  white-space: nowrap;
}

.topbar-user-avatar {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--kt-color-primary-border-subtle);
  border-radius: 50%;
  background: var(--kt-color-primary);
  color: var(--kt-color-bg-white);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1;
}

.topbar-user-name {
  overflow: hidden;
  color: var(--kt-color-text-primary);
  text-overflow: ellipsis;
}

.app-nav {
  height: 100%;
  gap: 1rem;
}

.nav-item {
  display: flex;
  align-items: stretch;
}

.app-nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 100%;
  min-height: 4rem;
  padding: 0 1rem;
  color: var(--kt-color-text-secondary);
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: 1;
  transition: color 0.2s ease;
}

.app-nav-link:hover,
.app-nav-link:focus-visible {
  color: var(--kt-color-primary-dark);
}

.app-nav-link.active {
  color: var(--kt-color-primary);
}

.app-nav-link.active::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--kt-color-primary);
}

.nav-icon {
  font-size: 1rem;
  line-height: 1;
  color: var(--kt-color-text-tertiary);
}

.app-nav-link.active .nav-icon {
  color: var(--kt-color-primary);
}

@media (min-width: 992px) {
  .topbar.navbar > .topbar-container.container-fluid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  }

  .app-brand {
    grid-column: 1;
    justify-self: start;
  }

  .topbar-collapse {
    display: flex !important;
    flex: 0 0 auto;
    grid-column: 2;
    justify-self: center;
    min-width: 0;
    width: max-content;
  }

  .app-nav {
    margin-right: 0 !important;
    margin-left: 0 !important;
  }

  .topbar-actions {
    flex: 0 0 auto;
    grid-column: 3;
    justify-self: end;
  }
}

@media (max-width: 991.98px) {
  .topbar-container {
    min-height: 3.9rem;
  }

  .app-brand {
    font-size: var(--kt-font-size-md);
  }

  .app-nav {
    width: 100%;
    height: auto;
    justify-content: flex-start;
    gap: 0;
  }

  .nav-item {
    display: block;
  }

  .app-nav-link {
    width: 100%;
    min-height: auto;
    padding: 0.95rem 0;
    border-left: 4px solid transparent;
  }

  .app-nav-link.active {
    border-left-color: var(--kt-color-primary-dark);
  }

  .app-nav-link.active::after {
    display: none;
  }

  .topbar-actions {
    margin-top: 0.75rem;
    justify-content: flex-start !important;
  }

  .topbar-user-status {
    justify-content: flex-start;
  }
}
</style>
