/**
 * Composable für Konfigurationen-Management
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { createKalkulationApi } from '../services/kalkulationApi'

export const useConfigurations = () => {
  const api = createKalkulationApi()

  const activeConfigurationVariantId = ref(null)
  const isNewConfigurationDraft = ref(false)
  const configurationVariants = ref([])
  const isRenameConfigurationPanelVisible = ref(false)
  const editingConfigurationVariantName = ref('')
  const isDeleteConfigurationConfirmationVisible = ref(false)

  let isLoadingConfigurationVariant = false
  let saveTimer = null
  let saveSequence = 0

  const hasActiveConfigurationVariant = computed(
    () => activeConfigurationVariantId.value !== null && activeConfigurationVariantId.value !== undefined
  )

  const filteredConfigurationVariants = computed(() => {
    if (!configurationVariants.value) return []
    return configurationVariants.value
      .filter((config) => !config.isHidden)
      .sort((a, b) => b.id - a.id)
  })

  const activeConfigurationVariantIndex = computed(() => {
    if (!hasActiveConfigurationVariant.value) return null
    return configurationVariants.value.findIndex((config) => config.id === activeConfigurationVariantId.value)
  })

  const activeConfigurationVariant = computed(() => {
    const index = activeConfigurationVariantIndex.value
    return index !== null ? configurationVariants.value[index] : null
  })

  const activeConfigurationName = computed(() => activeConfigurationVariant.value?.name ?? '')

  const deleteConfigurationConfirmationText = computed(() => {
    return activeConfigurationVariant.value
      ? `Soll die Konfiguration "${activeConfigurationVariant.value.name}" wirklich gelöscht werden?`
      : ''
  })

  const isEditingConfigurationNameDuplicate = computed(() => {
    const editingName = editingConfigurationVariantName.value.trim()
    const activeId = activeConfigurationVariantId.value
    return configurationVariants.value.some(
      (config) => config.name.trim() === editingName && config.id !== activeId
    )
  })

  const canSaveConfigurationVariantName = computed(() => {
    const editingName = editingConfigurationVariantName.value.trim()
    return editingName.length > 0 && !isEditingConfigurationNameDuplicate.value
  })

  const loadConfigurations = async () => {
    try {
      const saved = await api.getKonfigurationen()
      configurationVariants.value = saved
    } catch (error) {
      console.error('Fehler beim Laden von Konfigurationen:', error)
      throw error
    }
  }

  const saveConfigurationVariant = async (variant) => {
    saveSequence++
    const currentSequence = saveSequence

    return new Promise((resolve, reject) => {
      clearTimeout(saveTimer)

      saveTimer = setTimeout(async () => {
        if (currentSequence !== saveSequence) {
          resolve()
          return
        }

        try {
          if (isLoadingConfigurationVariant) {
            resolve()
            return
          }

          if (variant.id === -1 || variant.id === -2) {
            const created = await api.createKonfiguration(variant)
            const index = configurationVariants.value.findIndex((v) => v.id === variant.id)
            if (index !== -1) {
              configurationVariants.value[index] = created
              if (activeConfigurationVariantId.value === variant.id) {
                activeConfigurationVariantId.value = created.id
              }
            }
          } else {
            await api.updateKonfiguration(variant.id, variant)
          }

          resolve()
        } catch (error) {
          console.error('Fehler beim Speichern der Konfiguration:', error)
          reject(error)
        }
      }, 2000)
    })
  }

  const selectConfigurationVariant = (id) => {
    activeConfigurationVariantId.value = id
    isRenameConfigurationPanelVisible.value = false
    isDeleteConfigurationConfirmationVisible.value = false
  }

  const startNewConfiguration = (template) => {
    const newConfig = {
      id: -1,
      name: 'Neue Konfiguration',
      kundeId: template?.kundeId ?? null,
      druckermodellId: template?.druckermodellId ?? null,
      druckerVarianteId: template?.druckerVarianteId ?? null,
      total: template?.total ?? 0,
      calculation: template?.calculation ?? {},
      aktualisiertAm: new Date().toISOString(),
      isHidden: false
    }

    configurationVariants.value.unshift(newConfig)
    selectConfigurationVariant(newConfig.id)
  }

  const renameConfigurationVariant = () => {
    isRenameConfigurationPanelVisible.value = true
    editingConfigurationVariantName.value = activeConfigurationVariant.value?.name ?? ''
  }

  const commitConfigurationVariantRename = async () => {
    if (!canSaveConfigurationVariantName.value) return

    const variant = activeConfigurationVariant.value
    if (variant) {
      variant.name = editingConfigurationVariantName.value.trim()
      await saveConfigurationVariant(variant)
    }

    isRenameConfigurationPanelVisible.value = false
  }

  const cancelConfigurationVariantRename = () => {
    isRenameConfigurationPanelVisible.value = false
    editingConfigurationVariantName.value = ''
  }

  const deleteConfigurationVariant = async () => {
    const variant = activeConfigurationVariant.value
    if (!variant) return

    try {
      if (variant.id > 0) {
        await api.deleteKonfiguration(variant.id)
      }

      const index = configurationVariants.value.indexOf(variant)
      if (index !== -1) {
        configurationVariants.value.splice(index, 1)
      }

      activeConfigurationVariantId.value = null
      isDeleteConfigurationConfirmationVisible.value = false
    } catch (error) {
      console.error('Fehler beim Löschen der Konfiguration:', error)
      throw error
    }
  }

  const duplicateConfigurationVariant = () => {
    const variant = activeConfigurationVariant.value
    if (!variant) return

    const duplicated = {
      ...variant,
      id: -2,
      name: `${variant.name} (Kopie)`,
      calculation: { ...variant.calculation },
      erstelltAm: new Date().toISOString()
    }

    configurationVariants.value.unshift(duplicated)
    selectConfigurationVariant(duplicated.id)
  }

  const renameConfigurationVariantWithoutUI = (newName) => {
    const variant = activeConfigurationVariant.value
    if (variant) {
      variant.name = newName
      return saveConfigurationVariant(variant)
    }
  }

  const cancelDeleteConfigurationVariant = () => {
    isDeleteConfigurationConfirmationVisible.value = false
  }

  const confirmDeleteConfigurationVariant = () => {
    isDeleteConfigurationConfirmationVisible.value = true
  }

  const getConfigurationMeta = (variant) => {
    if (!variant) return {}
    return {
      druckermodell: variant.calculation?.druckermodell ?? '',
      variante: variant.calculation?.variante ?? '',
      kundeId: variant.kundeId ?? null
    }
  }

  onBeforeUnmount(() => {
    clearTimeout(saveTimer)
  })

  return {
    activeConfigurationVariantId,
    isNewConfigurationDraft,
    configurationVariants,
    isRenameConfigurationPanelVisible,
    editingConfigurationVariantName,
    isDeleteConfigurationConfirmationVisible,
    hasActiveConfigurationVariant,
    filteredConfigurationVariants,
    activeConfigurationVariant,
    activeConfigurationName,
    deleteConfigurationConfirmationText,
    isEditingConfigurationNameDuplicate,
    canSaveConfigurationVariantName,
    loadConfigurations,
    saveConfigurationVariant,
    selectConfigurationVariant,
    startNewConfiguration,
    renameConfigurationVariant,
    commitConfigurationVariantRename,
    cancelConfigurationVariantRename,
    deleteConfigurationVariant,
    duplicateConfigurationVariant,
    renameConfigurationVariantWithoutUI,
    cancelDeleteConfigurationVariant,
    confirmDeleteConfigurationVariant,
    getConfigurationMeta
  }
}
