<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import CalculationPanel from '../components/kalkulation/CalculationPanel.vue'
import ConfigurationOffcanvas from '../components/kalkulation/ConfigurationOffcanvas.vue'
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

  isConfigurationOffcanvasOpen,
  startNewConfiguration,
  openConfigurationOffcanvas,

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
  nettopreis,
  mietoptionen,
  getMietbetrag,
  mietbasis,

  closeConfigurationOffcanvas,
  filteredConfigurationVariants,
  activeConfigurationVariantId,
  selectConfigurationVariant,
  getConfigurationMeta,
  activeConfigurationName,
  isRenameConfigurationPanelVisible,
  isDeleteConfigurationConfirmationVisible,
  editingConfigurationVariantName,
  commitConfigurationVariantRename,
  cancelConfigurationVariantRename,
  isEditingConfigurationNameDuplicate,
  canSaveConfigurationVariantName,
  deleteConfigurationConfirmationText,
  cancelDeleteConfigurationVariant,
  confirmDeleteConfigurationVariant,
  renameConfigurationVariant,
  duplicateConfigurationVariant,
  deleteConfigurationVariant
} = useKalkulation()

const handleOpenKalkulationOfferten = () => {
  openConfigurationOffcanvas()
}

onMounted(() => {
  window.addEventListener('open-kalkulation-offerten', handleOpenKalkulationOfferten)
})

onBeforeUnmount(() => {
  window.removeEventListener('open-kalkulation-offerten', handleOpenKalkulationOfferten)
})
</script>

<template>
  <section class="kalkulation-view">
    <div class="col-12">
      <div class="card shadow-sm border-0">
        <div class="card-body calculation-page-card-body">
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

          <template v-if="druckermarke && (druckermodell || isExotischesModell)">
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
              @add-position="addPosition"
              @remove-position="removePosition"
            />

            <CalculationPanel
              v-model:eintausch-rabatt-prozent="eintauschRabattProzent"
              v-model:lieferung-option="lieferungOption"
              v-model:restwert-monate="restwertMonate"
              v-model:restwert-betrag="restwertBetrag"
              :verkaufspreis="verkaufspreis"
              :einkaufspreis="einkaufspreis"
              :eintausch-rabatt-betrag="eintauschRabattBetrag"
              :lieferung-optionen="lieferungOptionen"
              :lieferung-betrag="lieferungBetrag"
              :nettopreis="nettopreis"
              :mietoptionen="mietoptionen"
              :mietbasis="mietbasis"
              :normalize-percent="normalizePercent"
              :update-lieferung-option="updateLieferungOption"
              :normalize-restwert-monate="normalizeRestwertMonate"
              :normalize-restwert-betrag="normalizeRestwertBetrag"
              :get-mietbetrag="getMietbetrag"
              :format-amount="formatAmount"
            />
          </template>

          <div v-else class="calculation-empty-offer">
            <i class="pi pi-print calculation-empty-icon" aria-hidden="true"></i>

            <div class="calculation-empty-title">
              Auswahl starten
            </div>
            <div class="calculation-empty-text">
              Wähle Kunde, Druckermarke und Druckermodell, um Positionen zu erfassen. Für exotische Modelle wird die manuelle Kalkulation automatisch geöffnet.
            </div>
          </div>
        </div>
      </div>
    </div>

    <ConfigurationOffcanvas
      v-model:editing-configuration-variant-name="editingConfigurationVariantName"
      :is-open="isConfigurationOffcanvasOpen"
      :filtered-configuration-variants="filteredConfigurationVariants"
      :active-configuration-variant-id="activeConfigurationVariantId"
      :active-configuration-name="activeConfigurationName"
      :is-rename-configuration-panel-visible="isRenameConfigurationPanelVisible"
      :is-delete-configuration-confirmation-visible="isDeleteConfigurationConfirmationVisible"
      :is-editing-configuration-name-duplicate="isEditingConfigurationNameDuplicate"
      :can-save-configuration-variant-name="canSaveConfigurationVariantName"
      :delete-configuration-confirmation-text="deleteConfigurationConfirmationText"
      :format-amount="formatAmount"
      :get-configuration-meta="getConfigurationMeta"
      @close="closeConfigurationOffcanvas"
      @select-configuration="selectConfigurationVariant"
      @commit-rename="commitConfigurationVariantRename"
      @cancel-rename="cancelConfigurationVariantRename"
      @cancel-delete="cancelDeleteConfigurationVariant"
      @confirm-delete="confirmDeleteConfigurationVariant"
      @start-new-configuration="startNewConfiguration"
      @rename-configuration="renameConfigurationVariant"
      @duplicate-configuration="duplicateConfigurationVariant"
      @delete-configuration="deleteConfigurationVariant"
    />
  </section>
</template>