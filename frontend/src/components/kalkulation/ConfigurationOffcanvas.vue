<script setup>
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  filteredConfigurationVariants: {
    type: Array,
    required: true
  },
  activeConfigurationVariantId: {
    type: [Number, String],
    default: null
  },
  activeConfigurationName: {
    type: String,
    required: true
  },
  isRenameConfigurationPanelVisible: {
    type: Boolean,
    required: true
  },
  isDeleteConfigurationConfirmationVisible: {
    type: Boolean,
    required: true
  },
  isEditingConfigurationNameDuplicate: {
    type: Boolean,
    required: true
  },
  canSaveConfigurationVariantName: {
    type: Boolean,
    required: true
  },
  deleteConfigurationConfirmationText: {
    type: String,
    required: true
  },
  formatAmount: {
    type: Function,
    required: true
  },
  getConfigurationMeta: {
    type: Function,
    required: true
  }
})

const editingConfigurationVariantName = defineModel('editingConfigurationVariantName', {
  type: String,
  required: true
})

const emit = defineEmits([
  'close',
  'select-configuration',
  'commit-rename',
  'cancel-rename',
  'cancel-delete',
  'confirm-delete',
  'start-new-configuration',
  'rename-configuration',
  'duplicate-configuration',
  'delete-configuration'
])

const configurationVariantNameInput = ref(null)
const hasActiveConfiguration = computed(
  () => props.activeConfigurationVariantId !== null && props.activeConfigurationVariantId !== undefined
)
const hasSavedConfigurations = computed(() => props.filteredConfigurationVariants.length > 0)

watch(
  () => props.isRenameConfigurationPanelVisible,
  (isVisible) => {
    if (!isVisible) {
      return
    }

    nextTick(() => {
      configurationVariantNameInput.value?.focus()
      configurationVariantNameInput.value?.select()
    })
  }
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="configuration-backdrop"
      @click="emit('close')"
      @touchmove.prevent
      @wheel.prevent
    ></div>

    <aside
      v-if="isOpen"
      id="configuration-offcanvas"
      class="configuration-offcanvas"
      role="dialog"
      aria-modal="true"
      aria-labelledby="configuration-offcanvas-title"
      @touchmove.stop
      @wheel.stop
    >
      <div class="configuration-offcanvas-header">
        <h3 id="configuration-offcanvas-title" class="configuration-offcanvas-title">
          Offerten
        </h3>
        <button
          type="button"
          class="configuration-close-button"
          aria-label="Offerten schliessen"
          @click="emit('close')"
        >
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>

      <div class="configuration-offcanvas-body">
        <div
          class="configuration-variant-list"
          :class="{ 'is-empty': !hasSavedConfigurations }"
          role="listbox"
          aria-label="Offerten"
        >
          <div
            v-if="!hasSavedConfigurations"
            class="configuration-empty-state"
          >
            <div class="configuration-empty-state-title">
              Noch keine Offerten
            </div>
            <div class="configuration-empty-state-text">
              Erstelle deine erste Offerte.
            </div>
          </div>
          <div
            v-for="configurationVariant in filteredConfigurationVariants"
            :key="configurationVariant.id"
            class="configuration-variant-item"
            :class="{ 'is-active': configurationVariant.id === activeConfigurationVariantId }"
            role="option"
            tabindex="0"
            :aria-selected="configurationVariant.id === activeConfigurationVariantId"
            :title="configurationVariant.name"
            @click="emit('select-configuration', configurationVariant.id)"
            @keydown.enter.prevent="emit('select-configuration', configurationVariant.id)"
            @keydown.space.prevent="emit('select-configuration', configurationVariant.id)"
          >
            <span class="configuration-variant-content">
              <span class="configuration-variant-title-row">
                <span
                  class="configuration-variant-name"
                  :title="configurationVariant.name"
                >
                  {{ configurationVariant.name }}
                </span>
                <span class="configuration-variant-title-actions">
                  <i
                    class="pi pi-angle-right configuration-variant-chevron"
                    aria-hidden="true"
                  ></i>
                </span>
              </span>
              <span
                class="configuration-variant-total"
                :title="`Nettopreis: CHF ${formatAmount(configurationVariant.total)}`"
              >
                Nettopreis: CHF {{ formatAmount(configurationVariant.total) }}
              </span>
              <span
                class="configuration-variant-meta"
                :title="getConfigurationMeta(configurationVariant).line1"
              >
                {{ getConfigurationMeta(configurationVariant).line1 }}
              </span>
              <span
                class="configuration-variant-meta configuration-variant-machine"
                :title="getConfigurationMeta(configurationVariant).line2"
              >
                {{ getConfigurationMeta(configurationVariant).line2 }}
              </span>
            </span>
          </div>
        </div>

        <div class="configuration-action-list" aria-label="Offertenaktionen">
          <template v-if="!hasSavedConfigurations">
            <button
              type="button"
              class="configuration-primary-action-button"
              @click="emit('start-new-configuration')"
            >
              <i class="pi pi-plus" aria-hidden="true"></i>
              <span>Neue Offerte</span>
            </button>
          </template>
          <div
            v-else-if="isRenameConfigurationPanelVisible"
            class="configuration-rename-panel"
          >
            <div class="configuration-panel-title">
              Offerte umbenennen
            </div>
            <input
              id="configuration-rename-input"
              ref="configurationVariantNameInput"
              v-model="editingConfigurationVariantName"
              type="text"
              class="configuration-panel-input"
              @keydown.enter.prevent="emit('commit-rename')"
              @keydown.esc.prevent="emit('cancel-rename')"
            />
            <div
              v-if="!editingConfigurationVariantName.trim()"
              class="configuration-panel-error"
            >
              Name darf nicht leer sein
            </div>
            <div
              v-else-if="isEditingConfigurationNameDuplicate"
              class="configuration-panel-error"
            >
              Dieser Name existiert bereits
            </div>
            <div class="configuration-panel-actions">
              <button
                type="button"
                class="configuration-confirm-button"
                @click="emit('cancel-rename')"
              >
                Abbrechen
              </button>
              <button
                type="button"
                class="configuration-confirm-button is-primary"
                :disabled="!canSaveConfigurationVariantName"
                @click="emit('commit-rename')"
              >
                Speichern
              </button>
            </div>
          </div>
          <div
            v-else-if="isDeleteConfigurationConfirmationVisible"
            class="configuration-delete-confirmation"
          >
            <div class="configuration-delete-confirmation-text">
              {{ deleteConfigurationConfirmationText }}
            </div>
            <div class="configuration-delete-confirmation-actions">
              <button
                type="button"
                class="configuration-confirm-button"
                @click="emit('cancel-delete')"
              >
                Abbrechen
              </button>
              <button
                type="button"
                class="configuration-confirm-button is-danger"
                @click="emit('confirm-delete')"
              >
                Löschen
              </button>
            </div>
          </div>
          <template v-else>
            <div class="configuration-active-label">
              Aktive Offerte: {{ activeConfigurationName }}
            </div>
            <button
              type="button"
              class="configuration-primary-action-button"
              @click="emit('start-new-configuration')"
            >
              <i class="pi pi-plus" aria-hidden="true"></i>
              <span>Neue Offerte</span>
            </button>
            <button
              type="button"
              class="configuration-action-button"
              :disabled="!hasActiveConfiguration"
              @click="emit('rename-configuration')"
            >
              <i class="pi pi-pencil" aria-hidden="true"></i>
              <span>Umbenennen</span>
            </button>
            <button
              type="button"
              class="configuration-action-button"
              :disabled="!hasActiveConfiguration"
              @click="emit('duplicate-configuration')"
            >
              <i class="pi pi-copy" aria-hidden="true"></i>
              <span>Duplizieren</span>
            </button>
            <button
              type="button"
              class="configuration-action-button is-danger"
              :disabled="!hasActiveConfiguration"
              @click="emit('delete-configuration')"
            >
              <i class="pi pi-trash" aria-hidden="true"></i>
              <span>Löschen</span>
            </button>
          </template>
        </div>
      </div>
    </aside>
  </Teleport>
</template>
