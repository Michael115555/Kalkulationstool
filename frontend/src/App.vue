<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { createKalkulationApi } from './services/kalkulationApi'

const navigationItems = [
  { to: '/', name: 'kalkulation', label: 'Kalkulation', icon: 'pi pi-calculator' },
  { to: '/stammdaten', name: 'stammdaten', label: 'Kunden', icon: 'pi pi-users' },
  { to: '/projekte', name: 'projekte', label: 'Projekte', icon: 'pi pi-folder' }
]

const api = createKalkulationApi()
const route = useRoute()
const isNavigationOpen = ref(false)
const isContentReady = ref(false)

const toggleNavigation = () => {
  isNavigationOpen.value = !isNavigationOpen.value
}

const closeNavigation = () => {
  isNavigationOpen.value = false
}

const getRouteDataName = () => route.name ?? 'kalkulation'

const prefetchRouteData = (routeName) => {
  return api.prefetchRouteData(routeName)
}

const prefetchSecondaryViews = () => {
  api.prefetchRouteData('stammdaten')
  api.prefetchRouteData('projekte')
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
    <nav class="topbar navbar navbar-expand-lg">
      <div class="container-fluid topbar-container px-3 px-lg-4">
        <RouterLink class="navbar-brand app-brand mb-0" to="/">
          Kalkulationstool
        </RouterLink>

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
          <div class="d-none d-lg-block topbar-side-spacer"></div>

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

          <div class="d-flex topbar-actions justify-content-lg-end">
          </div>
        </div>
      </div>
    </nav>

    <main class="container-fluid app-content">
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
  background: #ffffff;
}

.app-content-fade-enter-active {
  transition: opacity 0.18s ease;
}

.app-content-fade-enter-from {
  opacity: 0;
}

.topbar {
  background: #ffffff;
  border-bottom: 1px solid #e7ebf3;
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
  color: #101828;
  font-size: var(--kt-font-size-lg);
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: var(--kt-line-height-tight);
}

.topbar-side-spacer,
.topbar-actions {
  flex: 1 1 0;
}

.topbar-collapse {
  height: 100%;
  align-items: stretch;
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
  color: #344054;
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: 1;
  transition: color 0.2s ease;
}

.app-nav-link:hover,
.app-nav-link:focus-visible {
  color: #1f4fff;
}

.app-nav-link.active {
  color: #2457ff;
}

.app-nav-link.active::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 3px;
  background: #2457ff;
}

.nav-icon {
  font-size: 1rem;
  line-height: 1;
  color: #667085;
}

.app-nav-link.active .nav-icon {
  color: #2457ff;
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
    border-left-color: #1f4fff;
  }

  .app-nav-link.active::after {
    display: none;
  }

  .topbar-actions {
    margin-top: 0.75rem;
    justify-content: flex-start !important;
  }
}
</style>
