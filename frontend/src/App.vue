<script setup>
import { RouterLink, RouterView } from 'vue-router'

const navigationItems = [
  { to: '/', label: 'Kalkulation', icon: 'pi pi-calculator' },
  { to: '/projekte', label: 'Projekte', icon: 'pi pi-folder' },
  { to: '/stammdaten', label: 'Stammdaten', icon: 'pi pi-users' },
  { to: '/auswertungen', label: 'Auswertungen', icon: 'pi pi-chart-bar' }
]
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
            <button
              class="profile-chip btn border-0 shadow-none text-decoration-none d-inline-flex align-items-center ms-lg-3"
              type="button"
              aria-label="Profilmenü öffnen"
            >
              <span class="profile-avatar">PR</span>
              <i class="pi pi-angle-down profile-chevron" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="container-fluid py-3">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  background: #f6f7fb;
}

.topbar {
  background: #ffffff;
  border-bottom: 1px solid #e7ebf3;
  padding: 0;
}

.topbar-container {
  min-height: 4.35rem;
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
  gap: 0.75rem;
  height: 100%;
  min-height: 4.35rem;
  padding: 0 1rem;
  color: #344054;
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: var(--kt-line-height-tight);
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
  color: #667085;
}

.app-nav-link.active .nav-icon {
  color: #2457ff;
}

.profile-chip {
  padding: 0;
  color: #344054;
  align-self: center;
}

.profile-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.9rem;
  height: 2.9rem;
  border-radius: 50%;
  background: #eef4ff;
  color: #2d5bda;
  font-size: var(--kt-font-size-sm);
  font-weight: 500;
}

.profile-chevron {
  margin-left: 0.7rem;
  font-size: var(--kt-font-size-sm);
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

  .profile-avatar {
    width: 2.25rem;
    height: 2.25rem;
    font-size: 0.82rem;
  }

  .topbar-actions {
    margin-top: 0.75rem;
    justify-content: flex-start !important;
  }

  .profile-chevron {
    margin-left: 0.55rem;
  }
}

@media (min-width: 992px) {
  .profile-chip {
    min-height: 100%;
  }
}
</style>
