<script setup>
import { computed, onBeforeUnmount, onMounted, ref, unref } from 'vue'
import ProjectEditorView from './KalkulationView.vue'
import { createKalkulationApi } from '../services/kalkulationApi'
import { formatAmount } from '../utils/numberFormat'

const api = createKalkulationApi()
const LOADING_INDICATOR_DELAY = 140

const isLoading = ref(false)
const hasLoadedProjekte = ref(false)
const errorMessage = ref('')
const projekte = ref([])
const kunden = ref([])
const verkaeufer = ref([])
const projectOverlay = ref(null)
const projectEditorView = ref(null)
let loadingIndicatorTimer = null

const sortedProjekte = computed(() =>
  [...projekte.value].sort((a, b) => {
    const idA = Number(a.id ?? 0)
    const idB = Number(b.id ?? 0)

    return idB - idA
  })
)

const getKundeId = (projekt) =>
  projekt.kundeId ??
  projekt.calculation?.kundeId ??
  projekt.kunde?.id ??
  null

const getKunde = (projekt) =>
  kunden.value.find((kunde) => Number(kunde.id) === Number(getKundeId(projekt))) ??
  projekt.kunde ??
  null

const getProjektKunde = (projekt) =>
  getKunde(projekt)?.firmenname ??
  projekt.calculation?.kundeName ??
  'Ohne Kunde'

const getProjektModell = (projekt) =>
  projekt.calculation?.druckermodell ??
  projekt.druckermodell ??
  ''

const getProjektVariante = (projekt) =>
  projekt.calculation?.variante ??
  ''

const getProjektName = (projekt) => {
  const variante = getProjektVariante(projekt).trim()
  const modell = getProjektModell(projekt).trim()

  if (variante) {
    return variante
  }

  if (modell) {
    return modell
  }

  return projekt.name || 'Ohne Projektnamen'
}

const getProjektVerkaeufer = (projekt) => {
  const kunde = getKunde(projekt)
  const verkaeuferId =
    kunde?.verkaeuferId ??
    kunde?.salespersonId ??
    projekt.calculation?.verkaeuferId ??
    null

  const eintrag = verkaeufer.value.find(
    (person) => Number(person.id) === Number(verkaeuferId)
  )

  return eintrag?.name ?? 'Kein Verkäufer'
}

const getPositionenCount = (projekt) =>
  projekt.positionsCount ??
  projekt.calculation?.positions?.filter(
    (position) => position.zubehoer || position.bezeichnung
  ).length ??
  0

const loadProjekte = async () => {
  window.clearTimeout(loadingIndicatorTimer)
  loadingIndicatorTimer = window.setTimeout(() => {
    if (!hasLoadedProjekte.value) {
      isLoading.value = true
    }
  }, LOADING_INDICATOR_DELAY)
  errorMessage.value = ''

  try {
    const [
      loadedProjekte,
      loadedKunden,
      loadedVerkaeufer
    ] = await Promise.all([
      api.getProjekte(),
      api.getKunden(),
      api.getVerkaeufer()
    ])

    projekte.value = loadedProjekte
    kunden.value = loadedKunden
    verkaeufer.value = loadedVerkaeufer
    hasLoadedProjekte.value = true
  } catch (error) {
    errorMessage.value = `Projekte konnten nicht geladen werden: ${error.message}`
  } finally {
    window.clearTimeout(loadingIndicatorTimer)
    isLoading.value = false
  }
}

const hydrateProjekteFromCache = () => {
  const cachedData = api.getCachedRouteData('projekte')

  if (!cachedData) {
    return false
  }

  projekte.value = cachedData.projekte
  kunden.value = cachedData.kunden
  verkaeufer.value = cachedData.verkaeufer
  hasLoadedProjekte.value = true
  isLoading.value = false
  errorMessage.value = ''

  return true
}

const projektToDelete = ref(null)
const isDeletingProjekt = ref(false)
const projectOverlayTitle = computed(() => {
  if (projectOverlay.value?.mode !== 'edit') {
    return 'Neues Projekt'
  }

  const projektName = String(projectOverlay.value?.projektName ?? '').trim()

  return projektName ? `Projekt bearbeiten: ${projektName}` : 'Projekt bearbeiten'
})
const getProjectEditorExposedValue = (key, fallback) => {
  const value = projectEditorView.value?.[key]

  return value === undefined || value === null ? fallback : unref(value)
}
const canSaveProjectOverlay = computed(() =>
  Boolean(getProjectEditorExposedValue('canSaveProject', false))
)
const projectSaveButtonLabel = computed(() =>
  getProjectEditorExposedValue('saveProjectButtonLabel', 'Projekt speichern')
)
const projectSaveButtonTitle = computed(() =>
  getProjectEditorExposedValue('saveProjectButtonTitle', projectSaveButtonLabel.value)
)

const askDeleteProjekt = (projekt) => {
  projektToDelete.value = projekt
}

const openNewProjekt = () => {
  api.prefetchRouteData('projektEditor')
  projectEditorView.value = null
  projectOverlay.value = {
    key: `new-${Date.now()}`,
    mode: 'new',
    projektId: null,
    projektName: ''
  }
}

const editProjekt = (projekt) => {
  api.prefetchRouteData('projektEditor')
  projectEditorView.value = null
  projectOverlay.value = {
    key: `edit-${projekt.id}-${Date.now()}`,
    mode: 'edit',
    projektId: projekt.id,
    projektName: getProjektName(projekt)
  }
}

const closeProjectOverlay = () => {
  projectOverlay.value = null
  projectEditorView.value = null
}

const handleProjectSaved = async () => {
  closeProjectOverlay()
  await loadProjekte()
}

const saveProjectFromHeader = async () => {
  await projectEditorView.value?.handleSaveProject?.()
}

const cancelDeleteProjekt = () => {
  if (isDeletingProjekt.value) {
    return
  }

  projektToDelete.value = null
}

const confirmDeleteProjekt = async () => {
  if (!projektToDelete.value || isDeletingProjekt.value) {
    return
  }

  isDeletingProjekt.value = true

  try {
    await api.deleteKonfiguration(projektToDelete.value.id)

    projekte.value = projekte.value.filter(
      (projekt) => projekt.id !== projektToDelete.value.id
    )

    projektToDelete.value = null
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = `Projekt konnte nicht gelöscht werden: ${error.message}`
  } finally {
    isDeletingProjekt.value = false
  }
}

const hasHydratedProjekte = hydrateProjekteFromCache()

onMounted(() => {
  if (!hasHydratedProjekte) {
    loadProjekte()
  }
})

onBeforeUnmount(() => {
  window.clearTimeout(loadingIndicatorTimer)
})
</script>

<template>
  <section class="projekte-view">
    <div class="col-12">
      <div class="card shadow-sm border-0">
        <div class="card-body projekte-page-card-body">
          <div class="projekte-toolbar">
            <h1 class="projekte-heading mb-0">Projekte</h1>
          </div>

          <div v-if="isLoading && !hasLoadedProjekte" class="alert alert-info mt-3 mb-0">
            Projekte werden geladen...
          </div>

          <div v-if="errorMessage" class="alert alert-danger mt-3 mb-0">
            {{ errorMessage }}
          </div>

          <div v-if="hasLoadedProjekte && !errorMessage" class="table-responsive projekte-table-responsive">
            <table class="table align-middle mb-0 table-bordered projekte-table">
              <thead>
                <tr>
                  <th scope="col" class="text-end">Nr.</th>
                  <th scope="col">Projektname</th>
                  <th scope="col">Kunde</th>
                  <th scope="col">Verkäufer</th>
                  <th scope="col" class="text-end">Positionen</th>
                  <th scope="col" class="text-end">Nettopreis CHF</th>
                  <th scope="col" class="text-center">Aktionen</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(projekt, index) in sortedProjekte"
                  :key="projekt.id"
                >
                  <td class="text-end project-number-cell">
                    {{ sortedProjekte.length - index }}
                  </td>

                  <td>{{ getProjektName(projekt) }}</td>

                  <td>{{ getProjektKunde(projekt) }}</td>

                  <td>{{ getProjektVerkaeufer(projekt) }}</td>

                  <td class="text-end project-number-cell">
                    {{ getPositionenCount(projekt) }}
                  </td>

                  <td class="text-end project-number-cell">
                    {{ formatAmount(projekt.total ?? 0) }}
                  </td>

                  <td class="text-center align-middle">
                    <div class="project-action-list">
                      <button
                        type="button"
                        class="table-edit-button"
                        aria-label="Projekt bearbeiten"
                        title="Projekt bearbeiten"
                        @click="editProjekt(projekt)"
                      >
                        <i class="pi pi-pencil" aria-hidden="true"></i>
                      </button>

                      <button
                        type="button"
                        class="table-delete-button"
                        aria-label="Projekt löschen"
                        @click="askDeleteProjekt(projekt)"
                      >
                        <i class="pi pi-trash" aria-hidden="true"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="sortedProjekte.length === 0" class="empty-position-row">
                  <td colspan="7">
                    <div class="project-empty-table-text">
                      Noch keine Projekte vorhanden.
                    </div>
                  </td>
                </tr>

                <tr class="project-add-table-row">
                  <td colspan="7">
                    <div class="project-add-content">
                      <button
                        type="button"
                        class="project-add-button"
                        aria-label="Neues Projekt"
                        @click="openNewProjekt"
                      >
                        <i class="pi pi-plus" aria-hidden="true"></i>
                        <span>Neues Projekt</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="projectOverlay"
      class="project-workspace-overlay"
      role="dialog"
      aria-modal="true"
      :aria-label="projectOverlayTitle"
    >
      <header class="project-workspace-header">
        <h2
          class="project-workspace-title"
          :title="projectOverlayTitle"
        >
          {{ projectOverlayTitle }}
        </h2>

        <div class="project-workspace-actions">
          <button
            type="button"
            class="project-overlay-cancel-button"
            aria-label="Projekt abbrechen"
            @click="closeProjectOverlay"
          >
            <span>Abbrechen</span>
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>

          <button
            type="button"
            class="btn toolbar-save-button project-workspace-save-button"
            :aria-label="canSaveProjectOverlay ? projectSaveButtonLabel : projectSaveButtonTitle"
            :title="projectSaveButtonTitle"
            :disabled="!canSaveProjectOverlay"
            @click="saveProjectFromHeader"
          >
            <span class="pi pi-save" aria-hidden="true"></span>
            <span>{{ projectSaveButtonLabel }}</span>
          </button>
        </div>
      </header>

      <main class="project-workspace-content">
        <ProjectEditorView
          ref="projectEditorView"
          :key="projectOverlay.key"
          :projekt-id="projectOverlay.projektId"
          @saved="handleProjectSaved"
        />
      </main>
    </div>

    <div
      v-if="projektToDelete"
      class="confirm-delete-backdrop"
      @click.self="cancelDeleteProjekt"
    >
      <div
        class="confirm-delete-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Projekt löschen?"
      >
        <div class="confirm-delete-content">
          <h2 class="confirm-delete-title">
            Projekt löschen?
          </h2>

          <p class="confirm-delete-text">
            Möchtest du „{{ getProjektName(projektToDelete) }}“ wirklich löschen?
          </p>
        </div>

        <div class="confirm-delete-actions">
          <button
            type="button"
            class="confirm-delete-button confirm-delete-button-secondary"
            :disabled="isDeletingProjekt"
            @click="cancelDeleteProjekt"
          >
            Abbrechen
          </button>

          <button
            type="button"
            class="confirm-delete-button confirm-delete-button-danger"
            :disabled="isDeletingProjekt"
            @click="confirmDeleteProjekt"
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
<style scoped>
.projekte-page-card-body {
  padding: 0 1rem 1.5rem;
}

.projekte-toolbar {
  min-height: 2.5rem;
  margin: 1.25rem 0 0.75rem;
}

.projekte-heading {
  display: flex;
  align-items: center;
  min-height: 2.35rem;
  margin: 0;
  color: var(--kt-color-text-primary);
  font-size: var(--kt-font-size-lg);
  font-weight: 600;
  letter-spacing: 0;
  line-height: 2.35rem;
}

.projekte-table-responsive {
  border: 1px solid var(--kt-color-border);
  border-radius: var(--kt-border-radius-sm);
  overflow-x: auto;
}

.projekte-table {
  width: 100%;
  min-width: 58rem;
  margin-bottom: 0;
  border-style: hidden;
  table-layout: fixed;
}

.projekte-table thead th {
  background-color: var(--kt-color-bg-light);
  border-bottom: 1px solid var(--kt-color-border-light);
  color: var(--kt-color-text-primary);
  font-size: var(--kt-font-size-sm);
  font-weight: 500;
  line-height: var(--kt-line-height-tight);
  vertical-align: middle;
  white-space: nowrap;
}

.projekte-table tbody td {
  background-color: var(--kt-color-bg-white);
  border-color: var(--kt-color-border);
}

.projekte-table tbody tr:not(.project-add-table-row):hover td {
  background-color: var(--kt-color-bg-light);
}

.projekte-table.table-bordered > :not(caption) > * > * {
  border-color: var(--kt-color-border);
}

.projekte-table th,
.projekte-table td {
  min-width: 0;
  padding: 0.32rem;
  vertical-align: middle;
}

.projekte-table th:nth-child(1),
.projekte-table td:nth-child(1) {
  width: 4.25rem;
}

.projekte-table th:nth-child(2),
.projekte-table td:nth-child(2) {
  width: 38%;
}

.projekte-table th:nth-child(3),
.projekte-table td:nth-child(3) {
  width: 21%;
}

.projekte-table th:nth-child(4),
.projekte-table td:nth-child(4) {
  width: 16%;
}

.projekte-table th:nth-child(5),
.projekte-table td:nth-child(5) {
  width: 7%;
}

.projekte-table th:nth-child(6),
.projekte-table td:nth-child(6) {
  width: 13%;
}

.projekte-table th:nth-child(7),
.projekte-table td:nth-child(7) {
  width: 5.5rem;
  min-width: 5.5rem;
  max-width: 5.5rem;
  text-align: center;
}

.project-number-cell {
  color: var(--kt-color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.project-action-list {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
}

.projekte-table .table-edit-button,
.projekte-table .table-delete-button {
  width: 1.75rem;
  height: 1.75rem;
}

.projekte-table .table-edit-button .pi,
.projekte-table .table-delete-button .pi {
  font-size: 0.95rem;
}

.project-empty-table-text {
  padding: 0.8rem 0;
  color: var(--kt-color-text-tertiary);
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  text-align: center;
}

.project-add-table-row td {
  padding: 0.68rem 1.45rem;
  border-top: 1px solid var(--kt-color-border-light);
  background: var(--kt-color-bg-light);
}

.project-add-content {
  display: flex;
  align-items: center;
  gap: 1.35rem;
  width: 100%;
}

.project-add-content::before,
.project-add-content::after {
  content: '';
  flex: 1 1 0;
  max-width: 38rem;
  border-top: 1px solid var(--kt-color-primary-border-subtle);
  opacity: 0.85;
}

.project-add-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 2.25rem;
  padding: 0 0.55rem;
  border: 0;
  border-radius: 0.25rem;
  background: transparent;
  color: var(--kt-color-primary);
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: var(--kt-line-height-tight);
  white-space: nowrap;
}

.project-add-button .pi {
  font-size: 1rem;
}

.project-add-button:hover,
.project-add-button:focus-visible {
  background: var(--kt-color-bg-very-light);
  color: var(--kt-color-primary-dark);
}

.project-add-button:focus-visible {
  border-radius: 0.2rem;
  outline: 2px solid var(--kt-color-primary-border-subtle);
  outline-offset: 0.2rem;
}

.project-workspace-overlay {
  position: fixed;
  inset: 0;
  z-index: 1080;
  display: flex;
  flex-direction: column;
  background: var(--kt-color-bg-white);
  overflow: hidden;
  overscroll-behavior: none;
}

.project-workspace-header {
  position: relative;
  z-index: 1030;
  display: flex;
  flex: 0 0 4rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 4rem;
  padding: 0 1rem;
  border-bottom: 1px solid var(--kt-color-border-light);
  background: var(--kt-color-bg-white);
}

.project-workspace-title {
  flex: 0 1 auto;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--kt-color-text-primary);
  font-size: var(--kt-font-size-lg);
  font-weight: 600;
  letter-spacing: 0;
  line-height: var(--kt-line-height-tight);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-workspace-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
  margin-left: auto;
  min-width: 0;
}

.project-workspace-save-button {
  gap: 0.55rem;
  min-width: 11.5rem;
  min-height: 2.75rem;
  box-shadow: none;
}

.project-workspace-save-button .pi {
  font-size: 1rem;
}

.project-overlay-cancel-button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0.45rem 0.85rem;
  border: 1px solid var(--kt-color-border);
  border-radius: var(--kt-border-radius-sm);
  background: var(--kt-color-bg-white);
  color: var(--kt-color-text-secondary);
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: 1.2;
  transition:
    background-color var(--kt-transition-fast),
    border-color var(--kt-transition-fast),
    color var(--kt-transition-fast);
}

.project-overlay-cancel-button:hover,
.project-overlay-cancel-button:focus-visible {
  border-color: var(--kt-color-text-light);
  background: var(--kt-color-bg-light);
  color: var(--kt-color-text-primary);
}

.project-overlay-cancel-button:focus-visible {
  outline: 2px solid var(--kt-color-primary-border-subtle);
  outline-offset: 0.2rem;
}

.project-workspace-content {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  background: var(--kt-color-bg-white);
}

.project-workspace-content :deep(.calculation-page-card-body) {
  min-height: calc(100vh - 4rem);
}

@media (max-width: 575.98px) {
  .project-workspace-header {
    flex-wrap: wrap;
    align-items: stretch;
    padding-top: 0.55rem;
    padding-bottom: 0.55rem;
  }

  .project-workspace-title {
    flex-basis: 100%;
  }

  .project-workspace-actions {
    flex: 1 1 100%;
    flex-wrap: wrap;
  }

  .project-workspace-save-button,
  .project-overlay-cancel-button {
    flex: 1 1 10rem;
    min-width: 0;
  }
}

.confirm-delete-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(var(--bs-dark-rgb), 0.46);
  backdrop-filter: blur(0.15rem);
}

.confirm-delete-dialog {
  display: grid;
  gap: 1rem;
  width: min(31rem, 100%);
  padding: 1.25rem;
  border: 1px solid var(--kt-color-border);
  border-radius: 0.42rem;
  background: var(--kt-color-bg-white);
  box-shadow: 0 1.5rem 4rem rgba(var(--bs-dark-rgb), 0.24);
}

.confirm-delete-content {
  min-width: 0;
}

.confirm-delete-title {
  margin: 0 0 0.3rem;
  color: var(--kt-color-text-primary);
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.25;
}

.confirm-delete-text {
  margin: 0;
  color: var(--kt-color-text-tertiary);
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: 1.4;
}

.confirm-delete-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 0.3rem;
}

.confirm-delete-button {
  min-height: 2.55rem;
  padding: 0.45rem 1rem;
  border-radius: 0.42rem;
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: 1.2;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.confirm-delete-button-secondary {
  border: 1px solid var(--kt-color-border);
  background: var(--kt-color-bg-white);
  color: var(--kt-color-text-secondary);
}

.confirm-delete-button-secondary:hover:not(:disabled),
.confirm-delete-button-secondary:focus-visible:not(:disabled) {
  background: var(--kt-color-bg-light);
  border-color: var(--kt-color-text-light);
}

.confirm-delete-button-danger {
  border: 1px solid var(--kt-color-error);
  background: var(--kt-color-error);
  color: var(--kt-color-bg-white);
}

.confirm-delete-button-danger:hover:not(:disabled),
.confirm-delete-button-danger:focus-visible:not(:disabled) {
  border-color: var(--kt-color-error-dark);
  background: var(--kt-color-error-dark);
}

.confirm-delete-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 1199.98px) {
  .projekte-page-card-body {
    padding-right: 1rem;
    padding-left: 1rem;
  }
}
</style>
