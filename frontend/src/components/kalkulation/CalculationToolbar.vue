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
  canSaveProject: {
    type: Boolean,
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
  'select-druckermodell',
  'save-project'
])

const isExotischesModellSelected = computed(() =>
  props.druckermarke === EXOTIC_MODEL_OPTION
)

const druckermarkenMitExotischemModell = computed(() => {
  const marken = Array.isArray(props.druckermarken)
    ? props.druckermarken.filter(Boolean)
    : []

  if (marken.includes(EXOTIC_MODEL_OPTION)) {
    return marken
  }

  return [
    ...marken,
    EXOTIC_MODEL_OPTION
  ]
})

const saveButtonTitle = computed(() => {
  if (isExotischesModellSelected.value) {
    return 'Exotische Modelle werden manuell kalkuliert und nicht in der Datenbank gespeichert'
  }

  if (props.canSaveProject) {
    return 'Projekt speichern'
  }

  return 'Bitte zuerst Kunde, Druckermarke, Druckermodell und Druckerposition wählen'
})
</script>

<template>
  <div class="calculation-config-section">
    <div class="calculation-toolbar">
      <div class="toolbar-field toolbar-field-customer">
        <label for="calculation-kunde" class="toolbar-label">
          Kunde:
        </label>

        <select
          id="calculation-kunde"
          :value="kundeId ?? ''"
          class="form-select control-field toolbar-select"
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
      </div>

      <div class="toolbar-field toolbar-field-brand">
        <label for="calculation-druckermarke" class="toolbar-label">
          Druckermarke:
        </label>

        <select
          id="calculation-druckermarke"
          :value="druckermarke"
          class="form-select control-field toolbar-select"
          :disabled="!canEditConfigurationSelection"
          @change="emit('select-druckermarke', $event.target.value)"
        >
          <option value="">Marke wählen</option>
          <option
            v-for="marke in druckermarkenMitExotischemModell"
            :key="marke"
            :value="marke"
          >
            {{ marke }}
          </option>
        </select>
      </div>

      <div class="toolbar-field toolbar-field-model">
        <label for="calculation-druckermodell" class="toolbar-label">
          Druckermodell:
        </label>

        <select
          id="calculation-druckermodell"
          :value="druckermodell"
          class="form-select control-field toolbar-select"
          :disabled="!canEditConfigurationSelection || !druckermarke || isExotischesModellSelected"
          @change="emit('select-druckermodell', $event.target.value)"
        >
          <option
            :value="isExotischesModellSelected ? MANUAL_CALCULATION_MODEL : ''"
          >
            {{ isExotischesModellSelected ? MANUAL_CALCULATION_MODEL : 'Modell wählen' }}
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
      </div>

      <div class="toolbar-field toolbar-field-save">
        <button
          type="button"
          class="btn btn-primary toolbar-save-button"
          :disabled="!canSaveProject || isExotischesModellSelected"
          :title="saveButtonTitle"
          @click="emit('save-project')"
        >
          Projekt speichern
        </button>
      </div>
    </div>
  </div>
</template>
