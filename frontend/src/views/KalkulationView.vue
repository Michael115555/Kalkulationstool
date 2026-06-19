<script setup>
import { computed, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import CalculationPanel from '../components/kalkulation/CalculationPanel.vue'
import CalculationToolbar from '../components/kalkulation/CalculationToolbar.vue'
import PositionsTable from '../components/kalkulation/PositionsTable.vue'
import { useKalkulation } from '../composables/useKalkulation'
import { useBodyScrollLock } from '../composables/useBodyScrollLock'

const props = defineProps({
  projektId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['saved'])
const isLeaveProjectEditDialogOpen = ref(false)
const activeProjektId = computed(() => props.projektId)
let pendingRouteLeaveResolve = null

useBodyScrollLock(isLeaveProjectEditDialogOpen)

const {
  isCatalogLoading,
  catalogError,

  kunden,
  kundeId,
  selectKunde,

  druckermarke,
  druckermarken,
  selectDruckermarke,
  isExotischesModell,

  druckermodell,
  druckermodelleDerMarkeNamen,
  selectDruckermodell,

  positionsKategorien,
  canSaveProject,
  saveProject,
  hasUnsavedEditedProjectChanges,
  saveProjectButtonLabel,
  saveProjectButtonTitle,
  canEditConfigurationSelection,
  canEditPositions,

  positions,
  konditionenA3Mfp,
  isEmptyPosition,
  updatePositionZubehoer,
  updatePositionProdukt,
  getProdukteByZubehoer,
  normalizeQuantity,
  normalizePrice,
  formatAmount,
  getEinkaufspreis,
  getGesamtpreis,
  removePosition,
  addPosition,

  verkaufspreis,
  einkaufspreis,
  eintauschRabattProzent,
  normalizePercent,
  eintauschRabattBetrag,
  lieferungOption,
  updateLieferungOption,
  lieferungOptionen,
  lieferungBetrag,
  restwertMonate,
  normalizeRestwertMonate,
  restwertBetrag,
  normalizeRestwertBetrag,
  inklusiveKopienSW,
  normalizeInklusiveKopienSW,
  inklusiveKopienColor,
  normalizeInklusiveKopienColor,
  preisZusatzPrintSW,
  normalizePreisZusatzPrintSW,
  preisZusatzPrintColor,
  normalizePreisZusatzPrintColor,
  flatratePauschalBetrag,
  normalizeFlatratePauschalBetrag,
  servicePauschaleMonat,
  scanpauschaleMietMonate,
  normalizeScanpauschaleMietMonate,
  scanpauschaleAuswahl,
  normalizeScanpauschaleAuswahl,
  kundenkontakt,
  versand,
  interneBemerkung,
  scanpauschaleBerechnet,
  recyclingGebuehrSwico,
  npkAbschlussgebuehr,
  nettopreis,
  mietoptionen,
  getMietbetrag,
  mietbasis
} = useKalkulation({
  projektId: activeProjektId
})

const resolvePendingRouteLeave = (canLeave) => {
  if (!pendingRouteLeaveResolve) {
    return
  }

  const resolve = pendingRouteLeaveResolve
  pendingRouteLeaveResolve = null
  isLeaveProjectEditDialogOpen.value = false
  resolve(canLeave)
}

const cancelLeaveProjectEdit = () => {
  resolvePendingRouteLeave(false)
}

const confirmLeaveProjectEdit = () => {
  resolvePendingRouteLeave(true)
}

const handleSaveProject = async () => {
  const savedProject = await saveProject()

  if (savedProject) {
    emit('saved', savedProject)
  }
}

defineExpose({
  canSaveProject,
  saveProjectButtonLabel,
  saveProjectButtonTitle,
  handleSaveProject
})

onBeforeRouteLeave(() => {
  if (!hasUnsavedEditedProjectChanges.value) {
    return true
  }

  if (pendingRouteLeaveResolve) {
    return false
  }

  isLeaveProjectEditDialogOpen.value = true

  return new Promise((resolve) => {
    pendingRouteLeaveResolve = resolve
  })
})
</script>

<template>
  <section class="kalkulation-view">
    <div class="col-12">
      <div class="card border-0">
        <div class="card-body calculation-page-card-body">
          <h1 class="visually-hidden">Kalkulation</h1>

          <div v-if="isCatalogLoading" class="alert alert-info mt-3 mb-0">
            Daten werden aus der Datenbank geladen...
          </div>

          <div v-if="catalogError" class="alert alert-danger mt-3 mb-0">
            {{ catalogError }}
          </div>

          <CalculationToolbar
            :kunden="kunden"
            :kunde-id="kundeId"
            :druckermarken="druckermarken"
            :druckermarke="druckermarke"
            :druckermodelle="druckermodelleDerMarkeNamen"
            :druckermodell="druckermodell"
            :can-edit-configuration-selection="canEditConfigurationSelection"
            @select-kunde="selectKunde"
            @select-druckermarke="selectDruckermarke"
            @select-druckermodell="selectDruckermodell"
          />

          <template v-if="(kundeId || isExotischesModell) && druckermarke && (druckermodell || isExotischesModell)">
            <PositionsTable
              :positions="positions"
              :zubehoer-kategorien="positionsKategorien"
              :can-edit-positions="canEditPositions"
              :can-edit-configuration-selection="canEditConfigurationSelection"
              :is-exotisches-modell="isExotischesModell"
              :is-empty-position="isEmptyPosition"
              :update-position-zubehoer="updatePositionZubehoer"
              :update-position-produkt="updatePositionProdukt"
              :get-produkte-by-zubehoer="getProdukteByZubehoer"
              :normalize-quantity="normalizeQuantity"
              :normalize-price="normalizePrice"
              :format-amount="formatAmount"
              :get-einkaufspreis="getEinkaufspreis"
              :get-gesamtpreis="getGesamtpreis"
              @add-position="addPosition"
              @remove-position="removePosition"
            />

            <CalculationPanel
              v-model:eintausch-rabatt-prozent="eintauschRabattProzent"
              v-model:lieferung-option="lieferungOption"
              v-model:restwert-monate="restwertMonate"
              v-model:restwert-betrag="restwertBetrag"
              v-model:inklusive-kopien-s-w="inklusiveKopienSW"
              v-model:inklusive-kopien-color="inklusiveKopienColor"
              v-model:preis-zusatz-print-s-w="preisZusatzPrintSW"
              v-model:preis-zusatz-print-color="preisZusatzPrintColor"
              v-model:flatrate-pauschal-betrag="flatratePauschalBetrag"
              v-model:scanpauschale-miet-monate="scanpauschaleMietMonate"
              v-model:scanpauschale-auswahl="scanpauschaleAuswahl"
              v-model:kundenkontakt="kundenkontakt"
              v-model:versand="versand"
              v-model:interne-bemerkung="interneBemerkung"
              :verkaufspreis="verkaufspreis"
              :einkaufspreis="einkaufspreis"
              :eintausch-rabatt-betrag="eintauschRabattBetrag"
              :lieferung-optionen="lieferungOptionen"
              :lieferung-betrag="lieferungBetrag"
              :nettopreis="nettopreis"
              :service-pauschale-monat="servicePauschaleMonat"
              :scanpauschale-berechnet="scanpauschaleBerechnet"
              :mietoptionen="mietoptionen"
              :mietbasis="mietbasis"
              :konditionen-a3-mfp="konditionenA3Mfp"
              :recycling-gebuehr-swico="recyclingGebuehrSwico"
              :npk-abschlussgebuehr="npkAbschlussgebuehr"
              :normalize-percent="normalizePercent"
              :update-lieferung-option="updateLieferungOption"
              :normalize-restwert-monate="normalizeRestwertMonate"
              :normalize-restwert-betrag="normalizeRestwertBetrag"
              :normalize-inklusive-kopien-s-w="normalizeInklusiveKopienSW"
              :normalize-inklusive-kopien-color="normalizeInklusiveKopienColor"
              :normalize-preis-zusatz-print-s-w="normalizePreisZusatzPrintSW"
              :normalize-preis-zusatz-print-color="normalizePreisZusatzPrintColor"
              :normalize-flatrate-pauschal-betrag="normalizeFlatratePauschalBetrag"
              :normalize-scanpauschale-miet-monate="normalizeScanpauschaleMietMonate"
              :normalize-scanpauschale-auswahl="normalizeScanpauschaleAuswahl"
              :get-mietbetrag="getMietbetrag"
              :format-amount="formatAmount"
            />
          </template>
        </div>
      </div>
    </div>

    <div
      v-if="isLeaveProjectEditDialogOpen"
      class="confirm-leave-backdrop"
      @click.self="cancelLeaveProjectEdit"
    >
      <div
        class="confirm-leave-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Bearbeitung verlassen?"
      >
        <div class="confirm-leave-content">
          <h2 class="confirm-leave-title">
            Bearbeitung verlassen?
          </h2>

          <p class="confirm-leave-text">
            Nicht gespeicherte Änderungen gehen verloren.
          </p>
        </div>

        <div class="confirm-leave-actions">
          <button
            type="button"
            class="confirm-leave-button confirm-leave-button-secondary"
            @click="confirmLeaveProjectEdit"
          >
            Verlassen
          </button>

          <button
            type="button"
            class="confirm-leave-button confirm-leave-button-primary"
            @click="cancelLeaveProjectEdit"
          >
            Weiter bearbeiten
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.confirm-leave-backdrop {
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

.confirm-leave-dialog {
  display: grid;
  gap: 1rem;
  width: min(31rem, 100%);
  padding: 1.25rem;
  border: 1px solid var(--kt-color-border);
  border-radius: 0.42rem;
  background: var(--kt-color-bg-white);
  box-shadow: 0 1.5rem 4rem rgba(var(--bs-dark-rgb), 0.24);
}

.confirm-leave-content {
  min-width: 0;
}

.confirm-leave-title {
  margin: 0 0 0.3rem;
  color: var(--kt-color-text-primary);
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.25;
}

.confirm-leave-text {
  margin: 0;
  color: var(--kt-color-text-tertiary);
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: 1.4;
}

.confirm-leave-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 0.3rem;
}

.confirm-leave-button {
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

.confirm-leave-button-secondary {
  border: 1px solid var(--kt-color-border);
  background: var(--kt-color-bg-white);
  color: var(--kt-color-text-secondary);
}

.confirm-leave-button-secondary:hover:not(:disabled),
.confirm-leave-button-secondary:focus-visible:not(:disabled) {
  background: var(--kt-color-bg-light);
  border-color: var(--kt-color-text-light);
}

.confirm-leave-button-primary {
  border: 1px solid var(--kt-color-primary);
  background: var(--kt-color-primary);
  color: var(--kt-color-bg-white);
}

.confirm-leave-button-primary:hover:not(:disabled),
.confirm-leave-button-primary:focus-visible:not(:disabled) {
  border-color: var(--kt-color-primary-dark);
  background: var(--kt-color-primary-dark);
}
</style>
