<script setup>
import CalculationPanel from '../components/kalkulation/CalculationPanel.vue'
import CalculationToolbar from '../components/kalkulation/CalculationToolbar.vue'
import PositionsTable from '../components/kalkulation/PositionsTable.vue'
import { useKalkulation } from '../composables/useKalkulation'

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
  canEditConfigurationSelection,
  canEditPositions,

  positions,
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
  scanpauschaleBerechnet,
  nettopreis,
  mietoptionen,
  getMietbetrag,
  mietbasis
} = useKalkulation()
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
            :can-save-project="canSaveProject"
            :can-edit-configuration-selection="canEditConfigurationSelection"
            @select-kunde="selectKunde"
            @select-druckermarke="selectDruckermarke"
            @select-druckermodell="selectDruckermodell"
            @save-project="saveProject"
          />

          <template v-if="(kundeId || isExotischesModell) && druckermarke && (druckermodell || isExotischesModell)">
            <PositionsTable
              :positions="positions"
              :zubehoer-kategorien="positionsKategorien"
              :can-edit-positions="canEditPositions"
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

  </section>
</template>
