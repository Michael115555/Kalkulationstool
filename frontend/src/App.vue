<script setup>
import { onMounted, ref } from 'vue'
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
const isInitialLoading = ref(true)

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

const loadInitialRouteData = async () => {
  try {
    await prefetchRouteData(getRouteDataName())
  } finally {
    isInitialLoading.value = false
  }
}

onMounted(async () => {
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
    <Transition name="app-loader">
      <div
        v-if="isInitialLoading"
        class="app-loading-overlay"
        aria-live="polite"
        aria-label="Kalkulationstool wird geladen"
      >
        <div class="app-loading-content" role="status">
          <span class="app-loading-title">Kalkulationstool</span>
          <span class="app-loading-dots" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
      </div>
    </Transition>

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
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-content {
  padding: 0;
}

.app-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 1080;
  display: grid;
  place-items: center;
  background: #ffffff;
}

.app-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  color: #101828;
}

.app-loading-title {
  font-size: var(--kt-font-size-lg);
  font-weight: 600;
  line-height: var(--kt-line-height-tight);
}

.app-loading-dots {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  min-height: 0.75rem;
}

.app-loading-dots span {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: #2563eb;
  opacity: 0.25;
  animation: app-loading-dot 1.15s ease-in-out infinite;
}

.app-loading-dots span:nth-child(2) {
  animation-delay: 0.16s;
}

.app-loading-dots span:nth-child(3) {
  animation-delay: 0.32s;
}

.app-loader-enter-active,
.app-loader-leave-active {
  transition: opacity 0.22s ease;
}

.app-loader-enter-from,
.app-loader-leave-to {
  opacity: 0;
}

@keyframes app-loading-dot {
  0%,
  80%,
  100% {
    opacity: 0.25;
    transform: scale(0.88);
  }

  40% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-loading-dots span {
    animation: none;
    opacity: 0.7;
  }

  .app-loader-enter-active,
  .app-loader-leave-active {
    transition: none;
  }
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
