<script setup>
import { computed } from 'vue'

const EXOTIC_MODEL_OPTION = 'Exotisches Modell'
const MANUAL_CALCULATION_MODEL = 'Manuelle Kalkulation'

const props = defineProps({
  kunden: {
    type: Array,
    required: true
  },
  kundeId: {
    type: [Number, String],
    default: null
  },
  druckermarken: {
    type: Array,
    required: true
  },
  druckermarke: {
    type: String,
    required: true
  },
  druckermodelle: {
    type: Array,
    required: true
  },
  druckermodell: {
    type: String,
    required: true
  },
  canEditConfigurationSelection: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits([
  'select-kunde',
  'select-druckermarke',
  'select-druckermodell'
])

const isExotischesModellSelected = computed(() =>
  props.druckermarke === EXOTIC_MODEL_OPTION
)

const hasSelectedKunde = computed(() => Boolean(props.kundeId))

const druckermarkenMitExotischemModell = computed(() => {
  const marken = Array.isArray(props.druckermarken)
    ? props.druckermarken.filter(Boolean)
    : []

  if (!hasSelectedKunde.value) {
    return [EXOTIC_MODEL_OPTION]
  }

  if (marken.includes(EXOTIC_MODEL_OPTION)) {
    return marken
  }

  return [
    ...marken,
    EXOTIC_MODEL_OPTION
  ]
})

const DRUCKERMARKE_PLACEHOLDER = 'Marke wählen'

const isDruckermarkeLocked = computed(() =>
  !props.canEditConfigurationSelection
)

const druckermodellPlaceholder = computed(() => {
  if (isExotischesModellSelected.value) {
    return MANUAL_CALCULATION_MODEL
  }

  if (!props.canEditConfigurationSelection) {
    return 'Daten werden geladen'
  }

  if (!hasSelectedKunde.value) {
    return 'Bitte zuerst Kunde wählen'
  }

  if (!props.druckermarke) {
    return 'Bitte zuerst Marke wählen'
  }

  return 'Modell wählen'
})

const isDruckermodellLocked = computed(() =>
  !props.canEditConfigurationSelection ||
  !props.druckermarke ||
  isExotischesModellSelected.value
)
</script>

<template>
  <div class="calculation-config-section">
    <div class="calculation-toolbar">
      <label class="toolbar-field toolbar-field-customer">
        <span class="toolbar-label">Kunde:</span>

        <select
          :value="kundeId ?? ''"
          class="form-select control-field toolbar-select"
          :class="{ 'pending-selection-field': !canEditConfigurationSelection }"
          :disabled="!canEditConfigurationSelection"
          @change="emit('select-kunde', $event.target.value)"
        >
          <option value="">Kunde wählen</option>
          <option
            v-for="kunde in kunden"
            :key="kunde.id"
            :value="kunde.id"
          >
            {{ kunde.firmenname }}
          </option>
        </select>
      </label>

      <label class="toolbar-field toolbar-field-brand">
        <span class="toolbar-label">Druckermarke:</span>

        <select
          v-if="isDruckermarkeLocked"
          class="form-select control-field toolbar-select pending-selection-field"
          :value="druckermarke || ''"
          :title="druckermarke || DRUCKERMARKE_PLACEHOLDER"
          disabled
          tabindex="-1"
          aria-label="Druckermarke"
        >
          <option :value="druckermarke || ''">
            {{ druckermarke || DRUCKERMARKE_PLACEHOLDER }}
          </option>
        </select>

        <select
          v-else
          :value="druckermarke"
          class="form-select control-field toolbar-select"
          :title="druckermarke || DRUCKERMARKE_PLACEHOLDER"
          @change="emit('select-druckermarke', $event.target.value)"
        >
          <option value="">{{ DRUCKERMARKE_PLACEHOLDER }}</option>
          <option
            v-for="marke in druckermarkenMitExotischemModell"
            :key="marke"
            :value="marke"
          >
            {{ marke }}
          </option>
        </select>
      </label>

      <label class="toolbar-field toolbar-field-model">
        <span class="toolbar-label">Druckermodell:</span>

        <select
          v-if="isDruckermodellLocked"
          class="form-select control-field toolbar-select pending-selection-field"
          :value="druckermodell || ''"
          :title="druckermodell || druckermodellPlaceholder"
          disabled
          tabindex="-1"
          aria-label="Druckermodell"
        >
          <option :value="druckermodell || ''">
            {{ druckermodell || druckermodellPlaceholder }}
          </option>
        </select>

        <select
          v-else
          :value="druckermodell"
          class="form-select control-field toolbar-select"
          :title="druckermodell || druckermodellPlaceholder"
          @change="emit('select-druckermodell', $event.target.value)"
        >
          <option
            :value="isExotischesModellSelected ? MANUAL_CALCULATION_MODEL : ''"
          >
            {{ druckermodellPlaceholder }}
          </option>
          <option
            v-for="modell in druckermodelle"
            v-show="!isExotischesModellSelected"
            :key="modell"
            :value="modell"
          >
            {{ modell }}
          </option>
        </select>
      </label>

    </div>
  </div>
</template>
