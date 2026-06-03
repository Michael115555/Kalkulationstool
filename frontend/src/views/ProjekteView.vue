<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createKalkulationApi } from '../services/kalkulationApi'
import { formatAmount } from '../utils/numberFormat'

const api = createKalkulationApi()
const router = useRouter()
const LOADING_INDICATOR_DELAY = 140

const isLoading = ref(false)
const hasLoadedProjekte = ref(false)
const errorMessage = ref('')
const projekte = ref([])
const kunden = ref([])
const verkaeufer = ref([])
let loadingIndicatorTimer = null

const sortedProjekte = computed(() =>
  [...projekte.value].sort((a, b) => {
    const aktualisiertAmA = Date.parse(a.aktualisiertAm ?? '') || 0
    const aktualisiertAmB = Date.parse(b.aktualisiertAm ?? '') || 0

    if (aktualisiertAmA !== aktualisiertAmB) {
      return aktualisiertAmB - aktualisiertAmA
    }

    return Number(b.id ?? 0) - Number(a.id ?? 0)
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

const askDeleteProjekt = (projekt) => {
  projektToDelete.value = projekt
}

const editProjekt = (projekt) => {
  router.push({
    name: 'kalkulation',
    query: { projektId: projekt.id }
  })
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
              </tbody>
            </table>
          </div>
        </div>
      </div>
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
  border: 1px solid #e4e7ec;
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
  background-color: #fbfcfe;
  border-bottom: 1px solid #e9edf3;
  color: var(--kt-color-text-primary);
  font-size: var(--kt-font-size-sm);
  font-weight: 500;
  line-height: var(--kt-line-height-tight);
  vertical-align: middle;
  white-space: nowrap;
}

.projekte-table tbody td {
  background-color: #ffffff;
  border-color: #e7ebf0;
}

.projekte-table tbody tr:hover td {
  background-color: #fbfcfe;
}

.projekte-table.table-bordered > :not(caption) > * > * {
  border-color: #e7ebf0;
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
  color: #667085;
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  text-align: center;
}

.confirm-delete-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(16, 24, 40, 0.46);
  backdrop-filter: blur(0.15rem);
}

.confirm-delete-dialog {
  display: grid;
  gap: 1rem;
  width: min(31rem, 100%);
  padding: 1.25rem;
  border: 1px solid #e4e7ec;
  border-radius: 0.42rem;
  background: #ffffff;
  box-shadow: 0 1.5rem 4rem rgba(16, 24, 40, 0.24);
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
  color: #667085;
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
  border: 1px solid #d0d5dd;
  background: #ffffff;
  color: #344054;
}

.confirm-delete-button-secondary:hover:not(:disabled),
.confirm-delete-button-secondary:focus-visible:not(:disabled) {
  background: #f8fafc;
  border-color: #98a2b3;
}

.confirm-delete-button-danger {
  border: 1px solid #dc2626;
  background: #dc2626;
  color: #ffffff;
}

.confirm-delete-button-danger:hover:not(:disabled),
.confirm-delete-button-danger:focus-visible:not(:disabled) {
  border-color: #b91c1c;
  background: #b91c1c;
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
