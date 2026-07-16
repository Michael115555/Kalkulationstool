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
const isContentReady = ref(false)
const appDisplayName = appConfig.displayName

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
    <nav class="topbar" aria-label="Hauptnavigation">
      <div class="container-fluid topbar-container px-3">
        <span class="navbar-brand app-brand mb-0">
          {{ appDisplayName }}
        </span>

        <div class="topbar-collapse">
          <ul class="nav app-nav">
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
  background: var(--kt-page-background);
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
  display: grid;
  grid-template-columns: minmax(8rem, 1fr) auto minmax(8rem, 1fr);
  align-items: center;
  column-gap: 1rem;
  min-height: 4rem;
  padding-top: 0;
  padding-bottom: 0;
}

.app-brand {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  color: var(--kt-color-text-primary);
  font-size: var(--kt-font-size-lg);
  font-weight: 600;
  letter-spacing: 0;
  line-height: var(--kt-line-height-tight);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topbar-collapse {
  display: flex;
  align-items: stretch;
  justify-content: center;
  min-width: 0;
  height: 100%;
}

.topbar-actions {
  align-items: center;
  justify-content: flex-end !important;
  min-width: 0;
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
  flex-wrap: nowrap;
  height: 100%;
  gap: 0.25rem;
  justify-content: center;
  min-width: 0;
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
  padding: 0 0.85rem;
  color: var(--kt-color-text-secondary);
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
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
  width: 1.1rem;
  font-size: 1.05rem;
  line-height: 1;
  text-align: center;
  color: var(--kt-color-text-tertiary);
}

.app-nav-link.active .nav-icon {
  color: var(--kt-color-primary);
}

@media (max-width: 767.98px) {
  .topbar-container {
    grid-template-columns: minmax(7rem, auto) minmax(0, 1fr) auto;
    column-gap: 0.65rem;
    min-height: 3.75rem;
  }

  .app-brand {
    font-size: var(--kt-font-size-md);
  }

  .app-nav {
    gap: 0;
  }

  .app-nav-link {
    gap: 0.35rem;
    min-height: 3.75rem;
    padding: 0 0.45rem;
    font-size: var(--kt-font-size-sm);
  }

  .nav-icon {
    width: 1rem;
    font-size: 1rem;
  }

  .topbar-user-status {
    gap: 0.45rem;
  }
}

@media (max-width: 439.98px) {
  .topbar-user-name {
    display: none;
  }

  .topbar-user-status {
    gap: 0;
  }
}
</style>
