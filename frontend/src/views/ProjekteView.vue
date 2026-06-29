<script setup>
import { computed, onBeforeUnmount, onMounted, ref, unref } from 'vue'
import ProjectEditorView from './KalkulationView.vue'
import { createKalkulationApi } from '../services/kalkulationApi'
import { formatAmount } from '../utils/numberFormat'
import { buildOffertePdfBytes, buildRechnungPdfBytes } from '../utils/offertePdf'
import { useBodyScrollLock } from '../composables/useBodyScrollLock'
import { appConfig } from '../config/appConfig'

const api = createKalkulationApi()
const LOADING_INDICATOR_DELAY = 140
const PROJECT_PAGE_SIZE = 10

const isLoading = ref(false)
const hasLoadedProjekte = ref(false)
const errorMessage = ref('')
const projekte = ref([])
const kunden = ref([])
const verkaeufer = ref([])
const projectPage = ref(1)
const projectTotal = ref(0)
const projectSearchQuery = ref('')
const appliedProjectSearchQuery = ref('')
const projectOverlay = ref(null)
const projectEditorView = ref(null)
const isCreatingOfferteProjektId = ref(null)
const isCreatingRechnungProjektId = ref(null)
const isOpeningRechnungProjektId = ref(null)
const isUpdatingOfferteStatusProjektId = ref(null)
const isDeletingRechnung = ref(false)
const generatedPdfUrls = new Set()
let loadingIndicatorTimer = null
let projectLoadRequestId = 0

const sortedProjekte = computed(() => projekte.value)
const projectTotalPages = computed(() =>
  Math.max(1, Math.ceil(projectTotal.value / PROJECT_PAGE_SIZE))
)
const projectRangeStart = computed(() =>
  projectTotal.value === 0 ? 0 : (projectPage.value - 1) * PROJECT_PAGE_SIZE + 1
)
const projectRangeEnd = computed(() =>
  Math.min(projectTotal.value, projectPage.value * PROJECT_PAGE_SIZE)
)

const getKundeId = (projekt) =>
  projekt.kundeId ??
  projekt.calculation?.kundeId ??
  projekt.kunde?.id ??
  null

const getKunde = (projekt) =>
  projekt.kunde ??
  kunden.value.find((kunde) => Number(kunde.id) === Number(getKundeId(projekt))) ??
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
  if (projekt.verkaeufer?.name) {
    return projekt.verkaeufer.name
  }

  const embeddedVerkaeufer = projekt.kunde?.verkaeufer

  if (embeddedVerkaeufer) {
    return `${embeddedVerkaeufer.vorname ?? ''} ${embeddedVerkaeufer.nachname ?? ''}`.trim()
  }

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

const getProjectNumber = (index) =>
  Math.max(projectTotal.value - ((projectPage.value - 1) * PROJECT_PAGE_SIZE + index), 1)

const getPositionenCount = (projekt) =>
  projekt.positionsCount ??
  projekt.calculation?.positions?.filter(
    (position) => position.zubehoer || position.bezeichnung
  ).length ??
  0

const loadProjekte = async () => {
  const requestId = projectLoadRequestId + 1
  projectLoadRequestId = requestId
  const requestedPage = projectPage.value
  const requestedQuery = appliedProjectSearchQuery.value

  window.clearTimeout(loadingIndicatorTimer)
  loadingIndicatorTimer = window.setTimeout(() => {
    if (requestId === projectLoadRequestId) {
      isLoading.value = true
    }
  }, LOADING_INDICATOR_DELAY)
  errorMessage.value = ''

  try {
    const loadedProjekte = await api.getProjekte({
      page: requestedPage,
      pageSize: PROJECT_PAGE_SIZE,
      query: requestedQuery
    })

    if (requestId !== projectLoadRequestId) {
      return
    }

    if (
      loadedProjekte.total > 0 &&
      !loadedProjekte.items.length &&
      requestedPage > 1
    ) {
      projectPage.value = Math.max(1, Math.ceil(loadedProjekte.total / PROJECT_PAGE_SIZE))
      await loadProjekte()
      return
    }

    projekte.value = loadedProjekte.items
    projectTotal.value = loadedProjekte.total
    hasLoadedProjekte.value = true
  } catch (error) {
    if (requestId !== projectLoadRequestId) {
      return
    }

    errorMessage.value = `Projekte konnten nicht geladen werden: ${error.message}`
  } finally {
    if (requestId === projectLoadRequestId) {
      window.clearTimeout(loadingIndicatorTimer)
      isLoading.value = false
    }
  }
}

const hydrateProjekteFromCache = () => {
  return false
}

const projektToDelete = ref(null)
const isDeletingProjekt = ref(false)
const isProjectModalOpen = computed(() =>
  Boolean(projectOverlay.value || projektToDelete.value)
)
const projectOverlayTitle = computed(() => {
  if (projectOverlay.value?.mode !== 'edit') {
    return 'Neues Projekt'
  }

  const projektName = String(projectOverlay.value?.projektName ?? '').trim()

  return projektName ? `Projekt bearbeiten: ${projektName}` : 'Projekt bearbeiten'
})

useBodyScrollLock(isProjectModalOpen)
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
  if (!projekt) {
    return
  }

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
  if (projekt?.offerteUnterschrieben) {
    return
  }

  api.prefetchRouteData('projektEditor')
  projectEditorView.value = null
  projectOverlay.value = {
    key: `edit-${projekt.id}-${Date.now()}`,
    mode: 'edit',
    projektId: projekt.id,
    projektName: getProjektName(projekt)
  }
}

const createProjectPdfOptions = (fullProjekt, generatedAt) => {
  const kunde = getKunde(fullProjekt)

  return {
    projekt: fullProjekt,
    kunde,
    verkaeuferName: getProjektVerkaeufer(fullProjekt),
    senderLines: appConfig.offerSenderLines,
    iban: appConfig.invoiceIban,
    paymentTerms: appConfig.invoicePaymentTerms,
    includeServiceConditions: false,
    generatedAt
  }
}

const getFixedOffertePdfOptions = async (projekt) => {
  const fullProjekt = await api.ensureOfferteDatum(projekt.id)

  return createProjectPdfOptions(
    fullProjekt,
    new Date(fullProjekt.offerteErstelltAm)
  )
}

const buildCurrentOffertePdfBytes = async (projekt) =>
  buildOffertePdfBytes(await getFixedOffertePdfOptions(projekt))

const bytesToBase64 = (bytes) => {
  const chunkSize = 0x8000
  let binary = ''

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }

  return window.btoa(binary)
}

const escapeStatusHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const buildOfferteStatusHtml = (message) => `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Offerte</title>
    <style>
      body {
        display: grid;
        min-height: 100vh;
        margin: 0;
        place-items: center;
        background: #f3f4f6;
        color: #1f2937;
        font-family: Inter, "Segoe UI", Arial, sans-serif;
      }

      .status {
        width: min(30rem, calc(100vw - 2rem));
        padding: 1.25rem;
        border: 1px solid #d7dde4;
        border-radius: 0.5rem;
        background: #fff;
        box-shadow: 0 1rem 2.5rem rgba(15, 23, 42, 0.14);
        font-weight: 600;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="status">${escapeStatusHtml(message)}</div>
  </body>
</html>`

const writeHtmlToWindow = (targetWindow, html) => {
  targetWindow.document.open()
  targetWindow.document.write(html)
  targetWindow.document.close()
  targetWindow.focus()
}

const openPdfInNewTab = (targetWindow, bytes) => {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)

  generatedPdfUrls.add(url)
  targetWindow.location.href = url
  targetWindow.focus()
}

const createOfferte = async (projekt) => {
  if (!projekt || isCreatingOfferteProjektId.value) {
    return
  }

  isCreatingOfferteProjektId.value = projekt.id
  errorMessage.value = ''
  let offerteWindow = null

  try {
    offerteWindow = window.open('', '_blank')

    if (!offerteWindow) {
      throw new Error('Offertenfenster konnte nicht geöffnet werden.')
    }

    writeHtmlToWindow(
      offerteWindow,
      buildOfferteStatusHtml('Offerte wird vorbereitet...')
    )

    const pdfBytes = projekt.offerteUnterschrieben
      ? await api.getOffertePdf(projekt.id)
      : await buildCurrentOffertePdfBytes(projekt)

    openPdfInNewTab(offerteWindow, pdfBytes)
  } catch (error) {
    errorMessage.value = `Offerte konnte nicht angezeigt werden: ${error.message}`

    if (offerteWindow) {
      writeHtmlToWindow(
        offerteWindow,
        buildOfferteStatusHtml(`Offerte konnte nicht angezeigt werden: ${error.message}`)
      )
    }
  } finally {
    isCreatingOfferteProjektId.value = null
  }
}

const openRechnung = async (projekt) => {
  if (!projekt?.rechnungErstellt || isOpeningRechnungProjektId.value) {
    return false
  }

  isOpeningRechnungProjektId.value = projekt.id
  errorMessage.value = ''
  let rechnungWindow = null

  try {
    rechnungWindow = window.open('', '_blank')

    if (!rechnungWindow) {
      throw new Error('Rechnungsfenster konnte nicht geöffnet werden.')
    }

    writeHtmlToWindow(
      rechnungWindow,
      buildOfferteStatusHtml('Rechnung wird vorbereitet...')
    )
    openPdfInNewTab(rechnungWindow, await api.getRechnungPdf(projekt.id))
    return true
  } catch (error) {
    errorMessage.value = `Rechnung konnte nicht angezeigt werden: ${error.message}`

    if (rechnungWindow) {
      writeHtmlToWindow(
        rechnungWindow,
        buildOfferteStatusHtml(`Rechnung konnte nicht angezeigt werden: ${error.message}`)
      )
    }

    return false
  } finally {
    isOpeningRechnungProjektId.value = null
  }
}

const createRechnung = async (projekt) => {
  if (
    !projekt?.offerteUnterschrieben ||
    projekt.rechnungErstellt ||
    isCreatingRechnungProjektId.value
  ) {
    return false
  }

  const generatedAt = new Date()
  isCreatingRechnungProjektId.value = projekt.id
  errorMessage.value = ''
  let rechnungWindow = null

  try {
    rechnungWindow = window.open('', '_blank')

    if (!rechnungWindow) {
      throw new Error('Rechnungsfenster konnte nicht geöffnet werden.')
    }

    writeHtmlToWindow(
      rechnungWindow,
      buildOfferteStatusHtml('Rechnung wird erstellt...')
    )

    const fullProjekt = await api.getKonfiguration(projekt.id)
    const pdfBytes = buildRechnungPdfBytes(
      createProjectPdfOptions(fullProjekt, generatedAt)
    )

    await api.createRechnung(projekt.id, {
      pdfBase64: bytesToBase64(pdfBytes)
    })
    await loadProjekte()
    openPdfInNewTab(rechnungWindow, pdfBytes)
    return true
  } catch (error) {
    errorMessage.value = `Rechnung konnte nicht erstellt werden: ${error.message}`

    if (rechnungWindow) {
      writeHtmlToWindow(
        rechnungWindow,
        buildOfferteStatusHtml(`Rechnung konnte nicht erstellt werden: ${error.message}`)
      )
    }

    return false
  } finally {
    isCreatingRechnungProjektId.value = null
  }
}

const updateOfferteUnterschrieben = async (projekt, event) => {
  if (!projekt || isUpdatingOfferteStatusProjektId.value || isDeletingRechnung.value) {
    event.target.checked = Boolean(projekt?.offerteUnterschrieben)
    return
  }

  const unterschrieben = Boolean(event.target.checked)

  if (projekt.offerteUnterschrieben === unterschrieben) {
    return
  }

  isUpdatingOfferteStatusProjektId.value = projekt.id
  errorMessage.value = ''

  try {
    if (projekt.rechnungErstellt && !unterschrieben) {
      isDeletingRechnung.value = true
      await api.deleteRechnung(projekt.id)
    }

    const offertePdfOptions = unterschrieben
      ? await getFixedOffertePdfOptions(projekt)
      : null
    const pdfBytes = offertePdfOptions
      ? buildOffertePdfBytes(offertePdfOptions)
      : null

    await api.setOfferteUnterschrieben(projekt.id, {
      unterschrieben,
      ...(pdfBytes
        ? {
            pdfBase64: bytesToBase64(pdfBytes)
          }
        : {})
    })
    await loadProjekte()
  } catch (error) {
    event.target.checked = Boolean(projekt.offerteUnterschrieben)
    errorMessage.value = `Offertenstatus konnte nicht geändert werden: ${error.message}`
  } finally {
    isUpdatingOfferteStatusProjektId.value = null
    isDeletingRechnung.value = false
  }
}

const closeProjectOverlay = () => {
  projectOverlay.value = null
  projectEditorView.value = null
}

const handleProjectSaved = async () => {
  closeProjectOverlay()
  projectPage.value = 1
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
    projektToDelete.value = null
    errorMessage.value = ''
    await loadProjekte()
  } catch (error) {
    errorMessage.value = `Projekt konnte nicht gelöscht werden: ${error.message}`
  } finally {
    isDeletingProjekt.value = false
  }
}

const goToPreviousProjectPage = async () => {
  if (projectPage.value <= 1 || isLoading.value) {
    return
  }

  projectPage.value -= 1
  await loadProjekte()
}

const applyProjectSearch = async () => {
  const nextSearchQuery = projectSearchQuery.value.trim()

  if (nextSearchQuery === appliedProjectSearchQuery.value && projectPage.value === 1) {
    return
  }

  appliedProjectSearchQuery.value = nextSearchQuery
  projectPage.value = 1
  await loadProjekte()
}

const handleProjectSearchInput = () => {
  applyProjectSearch()
}

const goToNextProjectPage = async () => {
  if (projectPage.value >= projectTotalPages.value || isLoading.value) {
    return
  }

  projectPage.value += 1
  await loadProjekte()
}

const hasHydratedProjekte = hydrateProjekteFromCache()

onMounted(() => {
  if (!hasHydratedProjekte) {
    loadProjekte()
  }
})

onBeforeUnmount(() => {
  window.clearTimeout(loadingIndicatorTimer)
  generatedPdfUrls.forEach((url) => URL.revokeObjectURL(url))
  generatedPdfUrls.clear()
})
</script>

<template>
  <section class="projekte-view">
    <div class="col-12">
      <div class="card shadow-sm border-0">
        <div class="card-body projekte-page-card-body">
          <div class="projekte-toolbar">
            <h1 class="projekte-heading mb-0">Projekte</h1>

            <form class="project-search-form" role="search" @submit.prevent="applyProjectSearch">
              <label class="visually-hidden" for="project-search-input">
                Projekte suchen
              </label>
              <input
                id="project-search-input"
                v-model="projectSearchQuery"
                type="search"
                class="project-search-input"
                placeholder="Projekte suchen"
                autocomplete="off"
                @input="handleProjectSearchInput"
                @search="handleProjectSearchInput"
              >
              <button
                type="submit"
                class="project-search-button project-search-button-last"
                aria-label="Projekte suchen"
                title="Projekte suchen"
                :disabled="isLoading"
              >
                <i class="pi pi-search" aria-hidden="true"></i>
              </button>
            </form>
          </div>

          <div v-if="isLoading && !hasLoadedProjekte" class="alert alert-info mt-3 mb-0">
            Projekte werden geladen...
          </div>

          <div v-if="errorMessage" class="alert alert-danger mt-3 mb-0">
            {{ errorMessage }}
          </div>

          <div v-if="hasLoadedProjekte" class="table-responsive projekte-table-responsive">
            <table class="table align-middle mb-0 table-bordered projekte-table">
              <thead>
                <tr>
                  <th scope="col" class="text-end">Nr.</th>
                  <th scope="col">Projektname</th>
                  <th scope="col">Kunde</th>
                  <th scope="col">Verkäufer</th>
                  <th scope="col" class="text-end">Positionen</th>
                  <th scope="col" class="text-end">Nettopreis CHF</th>
                  <th scope="col" class="text-center">Offerte</th>
                  <th scope="col" class="text-center">Unterschrieben</th>
                  <th scope="col" class="text-center">Rechnung</th>
                  <th scope="col" class="text-center">Aktionen</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(projekt, index) in sortedProjekte"
                  :key="projekt.id"
                  class="project-table-row"
                >
                  <td class="text-end project-number-cell">
                    {{ getProjectNumber(index) }}
                  </td>

                  <td :title="getProjektName(projekt)">
                    {{ getProjektName(projekt) }}
                  </td>

                  <td :title="getProjektKunde(projekt)">
                    {{ getProjektKunde(projekt) }}
                  </td>

                  <td :title="getProjektVerkaeufer(projekt)">
                    {{ getProjektVerkaeufer(projekt) }}
                  </td>

                  <td class="text-end project-number-cell">
                    {{ getPositionenCount(projekt) }}
                  </td>

                  <td class="text-end project-number-cell">
                    {{ formatAmount(projekt.total ?? 0) }}
                  </td>

                  <td class="project-offer-cell">
                    <button
                      type="button"
                      class="table-offer-button"
                      :aria-label="`Offerte für ${getProjektName(projekt)} als PDF im neuen Tab anzeigen`"
                      title="Offerte als PDF anzeigen"
                      :disabled="isCreatingOfferteProjektId === projekt.id"
                      @click="createOfferte(projekt)"
                    >
                      <i
                        :class="isCreatingOfferteProjektId === projekt.id
                          ? 'pi pi-spin pi-spinner'
                          : 'pi pi-file-pdf'"
                        aria-hidden="true"
                      ></i>
                    </button>
                  </td>

                  <td class="project-signed-cell">
                    <div class="form-check form-switch project-state-switch">
                      <input
                        type="checkbox"
                        role="switch"
                        class="form-check-input project-state-switch-input"
                        :checked="projekt.offerteUnterschrieben"
                        :disabled="isUpdatingOfferteStatusProjektId !== null || isDeletingRechnung"
                        :title="projekt.offerteUnterschrieben
                          ? 'Unterschrift entfernen'
                          : 'Als unterschrieben markieren'"
                        :aria-label="projekt.offerteUnterschrieben
                          ? `Unterschrift für ${getProjektName(projekt)} entfernen`
                          : `${getProjektName(projekt)} als unterschrieben markieren`"
                        @change="updateOfferteUnterschrieben(projekt, $event)"
                      >
                    </div>
                  </td>

                  <td class="project-invoice-cell">
                    <button
                      v-if="projekt.offerteUnterschrieben && !projekt.rechnungErstellt"
                      type="button"
                      class="project-invoice-action-button"
                      :aria-label="`Rechnung für ${getProjektName(projekt)} erstellen`"
                      title="Rechnung erstellen"
                      :disabled="isCreatingRechnungProjektId !== null"
                      @click="createRechnung(projekt)"
                    >
                      <span>{{ isCreatingRechnungProjektId === projekt.id
                        ? 'Wird erstellt…'
                        : 'Erstellen' }}</span>
                    </button>

                    <button
                      v-else-if="!projekt.offerteUnterschrieben"
                      type="button"
                      class="project-invoice-readonly-button"
                      :aria-label="`Rechnung für ${getProjektName(projekt)} kann erst nach unterschriebener Offerte erstellt werden`"
                      title="Erst nach unterschriebener Offerte möglich"
                      disabled
                    >
                      <span>Erstellen</span>
                    </button>

                    <button
                      v-else-if="projekt.rechnungErstellt"
                      type="button"
                      class="project-invoice-document-button"
                      :aria-label="`Rechnung für ${getProjektName(projekt)} als PDF im neuen Tab anzeigen`"
                      title="Rechnung als PDF anzeigen"
                      :disabled="isOpeningRechnungProjektId === projekt.id"
                      @click="openRechnung(projekt)"
                    >
                      <span>{{ isOpeningRechnungProjektId === projekt.id
                        ? 'Wird geöffnet…'
                        : 'Rechnung' }}</span>
                    </button>
                  </td>

                  <td class="project-actions-cell">
                    <div class="project-action-list">
                      <button
                        type="button"
                        class="table-edit-button"
                        :aria-label="projekt.offerteUnterschrieben
                          ? `Projekt ${getProjektName(projekt)} kann nach Unterschrift nicht bearbeitet werden`
                          : `Projekt ${getProjektName(projekt)} bearbeiten`"
                        :title="projekt.offerteUnterschrieben
                          ? 'Nach Unterschrift gesperrt'
                          : 'Projekt bearbeiten'"
                        :disabled="projekt.offerteUnterschrieben"
                        @click="editProjekt(projekt)"
                      >
                        <i class="pi pi-pencil" aria-hidden="true"></i>
                      </button>

                      <button
                        type="button"
                        class="table-delete-button"
                        :aria-label="`Projekt ${getProjektName(projekt)} löschen`"
                        title="Projekt löschen"
                        @click="askDeleteProjekt(projekt)"
                      >
                        <i class="pi pi-trash" aria-hidden="true"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="sortedProjekte.length === 0" class="empty-position-row">
                  <td colspan="10">
                    <div class="project-empty-table-text">
                      {{ appliedProjectSearchQuery ? 'Keine Projekte gefunden.' : 'Noch keine Projekte vorhanden.' }}
                    </div>
                  </td>
                </tr>

                <tr class="project-add-table-row">
                  <td colspan="10">
                    <div class="project-add-content">
                      <button
                        type="button"
                        class="project-add-button"
                        aria-label="Projekt hinzufügen"
                        @click="openNewProjekt"
                      >
                        <i class="pi pi-plus" aria-hidden="true"></i>
                        <span>Projekt hinzufügen</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-if="hasLoadedProjekte"
            class="project-pagination"
            aria-label="Projektseiten"
          >
            <div class="project-pagination-summary">
              {{ projectRangeStart }}-{{ projectRangeEnd }} von {{ projectTotal }} Projekten
            </div>

            <div class="project-pagination-controls">
              <button
                type="button"
                class="project-pagination-button"
                aria-label="Vorherige Projektseite"
                :disabled="projectPage <= 1 || isLoading"
                @click="goToPreviousProjectPage"
              >
                <i class="pi pi-chevron-left" aria-hidden="true"></i>
              </button>

              <span class="project-pagination-page">
                Seite {{ projectPage }} von {{ projectTotalPages }}
              </span>

              <button
                type="button"
                class="project-pagination-button"
                aria-label="Nächste Projektseite"
                :disabled="projectPage >= projectTotalPages || isLoading"
                @click="goToNextProjectPage"
              >
                <i class="pi pi-chevron-right" aria-hidden="true"></i>
              </button>
            </div>
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
      class="confirmation-backdrop"
      @click.self="cancelDeleteProjekt"
    >
      <div
        class="confirmation-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Projekt löschen?"
      >
        <div class="confirmation-content">
          <h2 class="confirmation-title">
            Projekt löschen?
          </h2>

          <p class="confirmation-text">
            Möchtest du „{{ getProjektName(projektToDelete) }}“ wirklich löschen?
          </p>

          <p
            v-if="projektToDelete.offerteUnterschrieben"
            class="confirmation-text confirmation-text-warning"
          >
            Die unterschriebene Offerte und eine vorhandene Rechnung werden dabei ebenfalls entfernt.
          </p>
        </div>

        <div class="confirmation-actions">
          <button
            type="button"
            class="confirmation-button confirmation-button-secondary"
            :disabled="isDeletingProjekt"
            @click="cancelDeleteProjekt"
          >
            Abbrechen
          </button>

          <button
            type="button"
            class="confirmation-button confirmation-button-danger"
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 2.5rem;
  margin: 1.75rem 0 1.35rem;
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

.project-search-form {
  display: inline-flex;
  flex: 0 1 18rem;
  align-items: center;
  justify-content: flex-end;
  max-width: 100%;
  min-width: 0;
}

.project-search-input {
  flex: 1 1 auto;
  min-width: 11rem;
  height: 2.5rem;
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--kt-color-border);
  border-right: 0;
  border-radius: var(--kt-border-radius-sm) 0 0 var(--kt-border-radius-sm);
  background: var(--kt-color-bg-white);
  color: var(--kt-color-text-primary);
  font-size: var(--kt-font-size-sm);
  line-height: var(--kt-line-height-tight);
  transition:
    border-color var(--kt-transition-fast),
    box-shadow var(--kt-transition-fast);
}

.project-search-input::placeholder {
  color: var(--kt-color-text-light);
}

.project-search-input:focus {
  position: relative;
  z-index: 1;
  border-color: var(--kt-color-primary-light);
  outline: 0;
  box-shadow: inset 0 0 0 1px var(--kt-color-primary-border-subtle);
}

.project-search-button {
  display: inline-flex;
  flex: 0 0 2.5rem;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 1px solid var(--kt-color-border);
  background: var(--kt-color-bg-white);
  color: var(--kt-color-text-secondary);
  transition:
    background-color var(--kt-transition-fast),
    border-color var(--kt-transition-fast),
    color var(--kt-transition-fast);
}

.project-search-button + .project-search-button {
  border-left: 0;
}

.project-search-button-last {
  border-radius: 0 var(--kt-border-radius-sm) var(--kt-border-radius-sm) 0;
}

.project-search-button:hover:not(:disabled),
.project-search-button:focus-visible:not(:disabled) {
  background: var(--kt-color-bg-light);
  border-color: var(--kt-color-text-light);
  color: var(--kt-color-text-primary);
}

.project-search-button:focus-visible {
  position: relative;
  z-index: 1;
  outline: 0;
  box-shadow: inset 0 0 0 1px var(--kt-color-primary-border-subtle);
}

.project-search-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.projekte-table-responsive {
  border: 1px solid var(--kt-color-border);
  border-radius: var(--kt-border-radius-sm);
  overflow-x: auto;
}

.projekte-table {
  width: 100%;
  min-width: 88rem;
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

.projekte-table tbody .project-table-row:hover td {
  background-color: var(--kt-color-bg-light);
}

.projekte-table.table-bordered > :not(caption) > * > * {
  border-color: var(--kt-color-border);
}

.projekte-table th,
.projekte-table td {
  min-width: 0;
  padding: 0.25rem 0.35rem;
  vertical-align: middle;
}

.projekte-table th:nth-child(1),
.projekte-table td:nth-child(1) {
  width: 3rem;
  min-width: 3rem;
  max-width: 3rem;
}

.projekte-table th:nth-child(2),
.projekte-table td:nth-child(2) {
  width: 17.5rem;
  min-width: 17.5rem;
}

.projekte-table th:nth-child(3),
.projekte-table td:nth-child(3) {
  width: 11.5rem;
  min-width: 11.5rem;
}

.projekte-table th:nth-child(4),
.projekte-table td:nth-child(4) {
  width: 11.5rem;
  min-width: 11.5rem;
}

.projekte-table td:nth-child(2),
.projekte-table td:nth-child(3),
.projekte-table td:nth-child(4) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.projekte-table th:nth-child(5),
.projekte-table td:nth-child(5) {
  width: 5.75rem;
  min-width: 5.75rem;
  max-width: 5.75rem;
}

.projekte-table th:nth-child(6),
.projekte-table td:nth-child(6) {
  width: 9.5rem;
  min-width: 9.5rem;
  max-width: 9.5rem;
}

.projekte-table th:nth-child(7),
.projekte-table td:nth-child(7) {
  width: 4.75rem;
  min-width: 4.75rem;
  max-width: 4.75rem;
  text-align: center;
}

.projekte-table th:nth-child(8),
.projekte-table td:nth-child(8) {
  width: 9.25rem;
  min-width: 9.25rem;
  max-width: 9.25rem;
  text-align: center;
}

.projekte-table th:nth-child(9),
.projekte-table td:nth-child(9) {
  width: 9.5rem;
  min-width: 9.5rem;
  max-width: 9.5rem;
  text-align: center;
}

.projekte-table th:nth-child(10),
.projekte-table td:nth-child(10) {
  width: 5.75rem;
  min-width: 5.75rem;
  max-width: 5.75rem;
  text-align: center;
  overflow: visible;
}

.project-number-cell {
  color: var(--kt-color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.project-offer-cell,
.project-signed-cell,
.project-invoice-cell,
.project-actions-cell {
  text-align: center;
  vertical-align: middle;
}

.project-state-switch {
  display: inline-flex;
  align-items: center;
  min-height: 0;
  padding-left: 0;
  margin: 0;
  vertical-align: middle;
}

.project-state-switch-input {
  float: none !important;
  width: 2.5rem !important;
  height: 1.3rem;
  margin: 0 !important;
  border: 1px solid var(--kt-color-border);
  background-color: var(--kt-color-border-light);
  box-shadow: none;
  cursor: pointer;
}

.project-state-switch-input:hover:not(:disabled) {
  border-color: var(--kt-color-text-light);
}

.project-state-switch-input:checked {
  border-color: var(--kt-color-primary);
  background-color: var(--kt-color-primary);
}

.project-state-switch-input:focus-visible {
  border-color: var(--kt-color-primary);
  box-shadow: 0 0 0 0.2rem var(--kt-color-primary-border-subtle);
}

.project-state-switch-input:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.project-invoice-action-button,
.project-invoice-readonly-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.32rem;
  width: 6.6rem;
  height: 1.85rem;
  padding: 0.2rem 0.5rem;
  border: 1px solid var(--kt-color-primary-border-subtle);
  border-radius: var(--kt-border-radius-sm);
  background: transparent;
  color: var(--kt-color-primary);
  font-size: 0.76rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  transition:
    background-color var(--kt-transition-fast),
    border-color var(--kt-transition-fast),
    color var(--kt-transition-fast);
}

.project-invoice-readonly-button {
  border-color: var(--kt-color-border-light);
  color: var(--kt-color-text-light);
}

.project-invoice-document-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 6.6rem;
  height: 1.85rem;
  padding: 0.2rem 0.5rem;
  border: 0;
  border-radius: 0.2rem;
  background: transparent;
  color: var(--kt-color-primary);
  font-size: 0.76rem;
  font-weight: 600;
  line-height: 1;
  text-decoration: underline;
  text-decoration-color: var(--kt-color-primary-border-subtle);
  text-decoration-thickness: 0.055em;
  text-underline-offset: 0.2rem;
  white-space: nowrap;
  transition:
    color var(--kt-transition-fast),
    text-decoration-color var(--kt-transition-fast);
}

.project-invoice-action-button:hover:not(:disabled),
.project-invoice-action-button:focus-visible:not(:disabled) {
  border-color: var(--kt-color-primary);
  background: var(--kt-color-primary-bg-subtle);
  color: var(--kt-color-primary-dark);
}

.project-invoice-document-button:hover:not(:disabled),
.project-invoice-document-button:focus-visible:not(:disabled) {
  color: var(--kt-color-primary-dark);
  text-decoration-color: currentColor;
}

.project-invoice-action-button:focus-visible,
.project-invoice-readonly-button:focus-visible,
.project-invoice-document-button:focus-visible {
  outline: 2px solid var(--kt-color-primary-border-subtle);
  outline-offset: 0.18rem;
}

.project-invoice-action-button:disabled,
.project-invoice-document-button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.project-invoice-readonly-button:disabled {
  cursor: not-allowed;
  opacity: 1;
}

.project-action-list {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.18rem;
  width: 100%;
}

.project-actions-cell .table-edit-button:disabled,
.project-actions-cell .table-delete-button:disabled {
  color: var(--kt-color-text-light);
  opacity: 0.42;
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
  border-top: 1px solid var(--kt-color-border);
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
  color: inherit;
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

.project-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  min-height: 3rem;
  margin-top: 0.75rem;
  color: var(--kt-color-text-secondary);
  font-size: var(--kt-font-size-sm);
  font-weight: 500;
}

.project-pagination-summary,
.project-pagination-page {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.project-pagination-controls {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.55rem;
}

.project-pagination-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 1px solid var(--kt-color-border);
  border-radius: var(--kt-border-radius-sm);
  background: var(--kt-color-bg-white);
  color: var(--kt-color-text-secondary);
  transition:
    background-color var(--kt-transition-fast),
    border-color var(--kt-transition-fast),
    color var(--kt-transition-fast);
}

.project-pagination-button:hover:not(:disabled),
.project-pagination-button:focus-visible:not(:disabled) {
  border-color: var(--kt-color-text-light);
  background: var(--kt-color-bg-light);
  color: var(--kt-color-text-primary);
}

.project-pagination-button:focus-visible {
  outline: 2px solid var(--kt-color-primary-border-subtle);
  outline-offset: 0.18rem;
}

.project-pagination-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
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
  background: var(--kt-page-background);
}

.project-workspace-content :deep(.calculation-page-card-body) {
  min-height: calc(100vh - 4rem);
  background: transparent;
}

@media (max-width: 575.98px) {
  .projekte-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .project-search-form {
    width: 100%;
  }

  .project-search-input {
    min-width: 0;
  }

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

.confirmation-backdrop {
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

.confirmation-dialog {
  display: grid;
  gap: 1rem;
  width: min(31rem, 100%);
  padding: 1.25rem;
  border: 1px solid var(--kt-color-border);
  border-radius: 0.42rem;
  background: var(--kt-color-bg-white);
  box-shadow: 0 1.5rem 4rem rgba(var(--bs-dark-rgb), 0.24);
}

.confirmation-content {
  min-width: 0;
}

.confirmation-title {
  margin: 0 0 0.3rem;
  color: var(--kt-color-text-primary);
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.25;
}

.confirmation-text {
  margin: 0;
  color: var(--kt-color-text-tertiary);
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: 1.4;
}

.confirmation-text-warning {
  margin-top: 0.55rem;
  color: var(--kt-color-error-dark);
}

.confirmation-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 0.3rem;
}

.confirmation-button {
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

.confirmation-button-secondary {
  border: 1px solid var(--kt-color-border);
  background: var(--kt-color-bg-white);
  color: var(--kt-color-text-secondary);
}

.confirmation-button-secondary:hover:not(:disabled),
.confirmation-button-secondary:focus-visible:not(:disabled) {
  background: var(--kt-color-bg-light);
  border-color: var(--kt-color-text-light);
}

.confirmation-button-danger {
  border: 1px solid var(--kt-color-error);
  background: var(--kt-color-error);
  color: var(--kt-color-bg-white);
}

.confirmation-button-danger:hover:not(:disabled),
.confirmation-button-danger:focus-visible:not(:disabled) {
  border-color: var(--kt-color-error-dark);
  background: var(--kt-color-error-dark);
}

.confirmation-button:disabled {
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
