<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()

const navigationItems = [
  { to: '/', label: 'Kalkulation', icon: 'pi pi-calculator' },
  { to: '/stammdaten', label: 'Kunden', icon: 'pi pi-users' },
  { to: '/projekte', label: 'Projekte', icon: 'pi pi-folder' }
]

const openKalkulationOfferten = () => {
  window.dispatchEvent(new CustomEvent('open-kalkulation-offerten'))
}
</script>

<template>
  <div class="app-shell min-vh-100">
    <nav class="topbar navbar navbar-expand-lg">
      <div class="container-fluid topbar-container px-3 px-lg-4">
        <a class="navbar-brand app-brand mb-0" href="#">
          Kalkulationstool
        </a>

        <button
          class="navbar-toggler border-0 shadow-none px-1"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavigation"
          aria-controls="mainNavigation"
          aria-expanded="false"
          aria-label="Navigation einblenden"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div id="mainNavigation" class="collapse navbar-collapse topbar-collapse">
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

    <div class="container-fluid app-content">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.app-content {
  padding: 1rem 0 0;
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

.topbar-offerten-button {
  gap: 0.55rem;
  min-height: 2.45rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid #8bb5ff;
  border-radius: 0.42rem;
  background: #ffffff;
  color: #2563eb;
  align-self: center;
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: var(--kt-line-height-tight);
}

.topbar-offerten-button:hover,
.topbar-offerten-button:focus-visible {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
}

.topbar-offerten-button .pi {
  font-size: 1rem;
  line-height: 1;
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
