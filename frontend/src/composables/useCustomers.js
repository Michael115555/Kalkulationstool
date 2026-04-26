/**
 * Composable für Kunden-Management
 */
import { computed, ref } from 'vue'
import { createKalkulationApi } from '../services/kalkulationApi'

export const useCustomers = () => {
  const api = createKalkulationApi()
  const kunden = ref([])
  const verkaeufer = ref([])

  const selectedKunde = computed(() =>
    kunden.value.find((kunde) => kunde.id === Number(kundeId.value))
  )

  let kundeId = null

  const setSelectedKundeId = (id) => {
    kundeId = id
  }

  const getSelectedKundeId = () => kundeId

  const loadCustomers = async () => {
    try {
      const [loadedKunden, loadedVerkaeufer] = await Promise.all([
        api.getKunden(),
        api.getVerkaeufer()
      ])
      kunden.value = loadedKunden
      verkaeufer.value = loadedVerkaeufer
    } catch (error) {
      console.error('Fehler beim Laden von Kunden:', error)
      throw error
    }
  }

  const addCustomer = async (customerData) => {
    const newCustomer = await api.createKunde(customerData)
    kunden.value.push(newCustomer)
    return newCustomer
  }

  const updateCustomer = async (id, customerData) => {
    const updated = await api.updateKunde(id, customerData)
    const index = kunden.value.findIndex((k) => k.id === id)
    if (index !== -1) {
      kunden.value[index] = updated
    }
    return updated
  }

  const deleteCustomer = async (id) => {
    await api.deleteKunde(id)
    kunden.value = kunden.value.filter((k) => k.id !== id)
  }

  return {
    kunden,
    verkaeufer,
    selectedKunde,
    setSelectedKundeId,
    getSelectedKundeId,
    loadCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer
  }
}
