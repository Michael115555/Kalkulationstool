<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
let loadingIndicatorTimer = null

const sortedProjekte = computed(() =>
  [...projekte.value].sort((a, b) =>
    getProjektName(a).localeCompare(getProjektName(b), 'de-CH')
  )
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

const projektToDelete = ref(null)
const isDeletingProjekt = ref(false)

const askDeleteProjekt = (projekt) => {
  projektToDelete.value = projekt
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

onMounted(loadProjekte)

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
            <h4 class="projekte-heading mb-0">Projekte</h4>
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
                  <th scope="col">Projektname</th>
                  <th scope="col">Kunde</th>
                  <th scope="col">Verkäufer</th>
                  <th scope="col" class="text-end">Positionen</th>
                  <th scope="col" class="text-end">Nettopreis CHF</th>
                  <th scope="col" class="text-center">Aktion</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="projekt in sortedProjekte"
                  :key="projekt.id"
                >
                  <td>
                    <input
                      :value="getProjektName(projekt)"
                      type="text"
                      class="form-control control-field readonly-price"
                      readonly
                      tabindex="-1"
                      aria-label="Projektname"
                    />
                  </td>

                  <td>
                    <input
                      :value="getProjektKunde(projekt)"
                      type="text"
                      class="form-control control-field readonly-price"
                      readonly
                      tabindex="-1"
                      aria-label="Kunde"
                    />
                  </td>

                  <td>
                    <input
                      :value="getProjektVerkaeufer(projekt)"
                      type="text"
                      class="form-control control-field readonly-price"
                      readonly
                      tabindex="-1"
                      aria-label="Verkäufer"
                    />
                  </td>

                  <td>
                    <input
                      :value="getPositionenCount(projekt)"
                      type="text"
                      class="form-control control-field text-end readonly-price"
                      readonly
                      tabindex="-1"
                      aria-label="Positionen"
                    />
                  </td>

                  <td>
                    <input
                      :value="formatAmount(projekt.total ?? 0)"
                      type="text"
                      class="form-control control-field text-end readonly-price"
                      readonly
                      tabindex="-1"
                      aria-label="Nettopreis CHF"
                    />
                  </td>

                  <td class="text-center align-middle">
                    <div class="project-action-list">
                      <button
                        type="button"
                        class="project-action-button project-action-icon-danger"
                        aria-label="Projekt löschen"
                        title="Projekt löschen"
                        @click="askDeleteProjekt(projekt)"
                      >
                        <i class="pi pi-trash" aria-hidden="true"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="sortedProjekte.length === 0" class="empty-position-row">
                  <td colspan="6">
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
          <h5 class="confirm-delete-title">
            Projekt löschen?
          </h5>

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
  min-height: 13rem;
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
  min-width: 0;
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
  width: 36%;
}

.projekte-table th:nth-child(2),
.projekte-table td:nth-child(2) {
  width: 20%;
}

.projekte-table th:nth-child(3),
.projekte-table td:nth-child(3) {
  width: 16%;
}

.projekte-table th:nth-child(4),
.projekte-table td:nth-child(4) {
  width: 9%;
}

.projekte-table th:nth-child(5),
.projekte-table td:nth-child(5) {
  width: 13%;
}

.projekte-table th:nth-child(6),
.projekte-table td:nth-child(6) {
  width: 6%;
  min-width: 4.8rem;
  max-width: 5.2rem;
  text-align: center;
}

.projekte-table input,
.projekte-table select {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.control-field {
  min-height: 2.35rem;
  min-width: 0;
  padding-top: 0.36rem;
  padding-right: 0.7rem;
  padding-bottom: 0.36rem;
  padding-left: 0.7rem;
  font-size: var(--kt-font-size-md);
  line-height: 1.2;
}

.readonly-price {
  background-color: #f8fafc;
  color: #667085;
  cursor: default;
  opacity: 1;
}

.project-action-list {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
}

.project-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #2563eb;
  transition: color 0.15s ease;
}

.project-action-button:hover:not(:disabled),
.project-action-button:focus-visible:not(:disabled) {
  color: #1d4ed8;
}

.project-action-icon-danger {
  color: #c9a0a0;
}

.project-action-icon-danger:hover:not(:disabled),
.project-action-icon-danger:focus-visible:not(:disabled) {
  color: #dc2626;
}

.project-action-button:focus-visible {
  border-radius: 0.2rem;
  outline: 2px solid #bfdbfe;
  outline-offset: 0.2rem;
}

.project-action-icon-danger:focus-visible {
  outline-color: #fecaca;
}

.project-action-button .pi {
  font-size: 1rem;
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
