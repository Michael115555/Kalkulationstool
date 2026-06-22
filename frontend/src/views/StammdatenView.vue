<template>
  <section class="stammdaten-view">
    <div class="col-12">
      <div class="card shadow-sm border-0">
        <div class="card-body customer-page-card-body">
          <div class="customer-toolbar">
            <h1 class="customers-heading mb-0">Kunden</h1>

            <form class="customer-search-form" role="search" @submit.prevent="applyCustomerSearch">
              <label class="visually-hidden" for="customer-search-input">
                Kunden suchen
              </label>
              <input
                id="customer-search-input"
                v-model="customerSearchQuery"
                type="search"
                class="customer-search-input"
                placeholder="Kunden suchen"
                autocomplete="off"
                @input="handleCustomerSearchInput"
                @search="handleCustomerSearchInput"
              >
              <button
                type="submit"
                class="customer-search-button customer-search-button-last"
                aria-label="Kunden suchen"
                title="Kunden suchen"
                :disabled="isLoadingCustomers"
              >
                <i class="pi pi-search" aria-hidden="true"></i>
              </button>
            </form>
          </div>

          <div v-if="isLoadingCustomers && !hasLoadedCustomers" class="alert alert-info mb-3">
            Kunden werden aus der Datenbank geladen...
          </div>
          <div v-if="customerError" class="alert alert-danger mb-3">
            {{ customerError }}
          </div>

          <div v-if="hasLoadedCustomers || customers.length" class="table-responsive customers-table-responsive">
            <table class="table align-middle mb-0 table-bordered customers-table">
              <thead>
                <tr>
                  <th scope="col">Firma</th>
                  <th scope="col">Ansprechperson</th>
                  <th scope="col">Strasse</th>
                  <th scope="col">PLZ / Ort</th>
                  <th scope="col">Verkäufer</th>
                  <th scope="col" class="text-center action-header">Aktion</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="customer in customers"
                  :key="customer.id"
                  class="customer-table-row"
                  :class="{ 'customer-active-row': isActiveCustomer(customer) }"
                  @click="rememberCustomerForCalculation(customer)"
                  @focusin="rememberCustomerForCalculation(customer)"
                >
                  <td>{{ customer.name || 'Ohne Firma' }}</td>
                  <td>{{ formatCustomerValue(customer.contactPerson) }}</td>
                  <td>{{ formatCustomerValue(customer.street) }}</td>
                  <td>{{ formatCustomerLocation(customer) }}</td>
                  <td>{{ getCustomerSalespersonName(customer) }}</td>
                  <td class="text-center align-middle">
                    <div class="customer-action-buttons">
                      <button
                        type="button"
                        class="table-edit-button"
                        aria-label="Kunde bearbeiten"
                        title="Kunde bearbeiten"
                        @click.stop="editCustomer(customer)"
                      >
                        <i class="pi pi-pencil" aria-hidden="true"></i>
                      </button>

                      <button
                        type="button"
                        class="table-delete-button"
                        aria-label="Kunde löschen"
                        title="Kunde löschen"
                        :disabled="customer.isDeleting"
                        @click.stop="askDeleteCustomer(customer)"
                      >
                        <i class="pi pi-trash" aria-hidden="true"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="customers.length === 0" class="customer-empty-table-row">
                  <td colspan="6">
                    <div class="customer-empty-table-text">
                      {{ appliedCustomerSearchQuery ? 'Keine Kunden gefunden.' : 'Noch keine Kunden vorhanden.' }}
                    </div>
                  </td>
                </tr>
                <tr class="customer-add-table-row">
                  <td colspan="6">
                    <div class="customer-add-content">
                      <button
                        type="button"
                        class="customer-add-button"
                        aria-label="Kunde hinzufügen"
                        @click="addCustomer"
                      >
                        <i class="pi pi-plus" aria-hidden="true"></i>
                        <span>Kunde hinzufügen</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-if="hasLoadedCustomers && !customerError"
            class="customer-pagination"
            aria-label="Kundenseiten"
          >
            <div class="customer-pagination-summary">
              {{ customerRangeStart }}-{{ customerRangeEnd }} von {{ customerTotal }} Kunden
            </div>

            <div class="customer-pagination-controls">
              <button
                type="button"
                class="customer-pagination-button"
                aria-label="Vorherige Kundenseite"
                :disabled="customerPage <= 1 || isLoadingCustomers"
                @click="goToPreviousCustomerPage"
              >
                <i class="pi pi-chevron-left" aria-hidden="true"></i>
              </button>

              <span class="customer-pagination-page">
                Seite {{ customerPage }} von {{ customerTotalPages }}
              </span>

              <button
                type="button"
                class="customer-pagination-button"
                aria-label="Nächste Kundenseite"
                :disabled="customerPage >= customerTotalPages || isLoadingCustomers"
                @click="goToNextCustomerPage"
              >
                <i class="pi pi-chevron-right" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="customerToDelete"
      class="confirm-delete-backdrop"
      @click.self="cancelDeleteCustomer"
    >
      <div
        class="confirm-delete-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Kunde löschen?"
      >
        <div class="confirm-delete-content">
          <h2 class="confirm-delete-title">
            Kunde löschen?
          </h2>

          <p class="confirm-delete-text">
            Möchtest du „{{ customerToDelete.name || 'Ohne Firma' }}“ wirklich löschen?
          </p>
        </div>

        <div class="confirm-delete-actions">
          <button
            type="button"
            class="confirm-delete-button confirm-delete-button-secondary"
            :disabled="isDeletingCustomer"
            @click="cancelDeleteCustomer"
          >
            Abbrechen
          </button>

          <button
            type="button"
            class="confirm-delete-button confirm-delete-button-danger"
            :disabled="isDeletingCustomer"
            @click="confirmDeleteCustomer"
          >
            Löschen
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="customerDraft"
      class="customer-dialog-backdrop"
      @click.self="cancelCustomerDialog"
    >
      <form
        class="customer-dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="customerDialogTitle"
        @submit.prevent="saveCustomerDialog"
      >
        <div class="customer-dialog-content">
          <h2 class="customer-dialog-title">
            {{ customerDialogTitle }}
          </h2>

          <div v-if="customerDialogError" class="alert alert-danger mb-0">
            {{ customerDialogError }}
          </div>

          <div class="customer-dialog-grid">
            <label class="customer-dialog-field">
              <span>Firma</span>
              <input
                v-model="customerDraft.name"
                class="form-control control-field"
                maxlength="255"
                autocomplete="organization"
                autofocus
                @input="clearCustomerDialogError"
              />
            </label>

            <label class="customer-dialog-field">
              <span>Ansprechperson</span>
              <input
                v-model="customerDraft.contactPerson"
                class="form-control control-field"
                maxlength="255"
                autocomplete="name"
                @input="clearCustomerDialogError"
              />
            </label>

            <label class="customer-dialog-field customer-dialog-field-wide">
              <span>Strasse</span>
              <input
                v-model="customerDraft.street"
                class="form-control control-field"
                maxlength="255"
                autocomplete="street-address"
                @input="clearCustomerDialogError"
              />
            </label>

            <label class="customer-dialog-field">
              <span>PLZ</span>
              <input
                v-model="customerDraft.postalCode"
                class="form-control control-field postal-code-control-field"
                maxlength="32"
                inputmode="numeric"
                pattern="[0-9]*"
                autocomplete="postal-code"
                @input="handleCustomerDraftPostalCodeInput"
              />
            </label>

            <label class="customer-dialog-field">
              <span>Ort</span>
              <input
                v-model="customerDraft.city"
                class="form-control control-field"
                maxlength="255"
                autocomplete="address-level2"
                @input="clearCustomerDialogError"
              />
            </label>

            <label class="customer-dialog-field">
              <span>E-Mail</span>
              <input
                v-model="customerDraft.email"
                class="form-control control-field"
                :class="{ 'is-invalid': hasCustomerEmailError(customerDraft) }"
                type="email"
                maxlength="255"
                autocomplete="email"
                placeholder="name@beispiel.ch"
                :aria-invalid="hasCustomerEmailError(customerDraft)"
                @input="clearCustomerDialogError"
              />
            </label>

            <label class="customer-dialog-field">
              <span>Telefon</span>
              <input
                v-model="customerDraft.phone"
                class="form-control control-field"
                :class="{ 'is-invalid': hasCustomerPhoneError(customerDraft) }"
                type="tel"
                maxlength="32"
                autocomplete="tel"
                inputmode="tel"
                placeholder="+41 79 123 45 67"
                :aria-invalid="hasCustomerPhoneError(customerDraft)"
                @blur="handleCustomerDraftPhoneBlur"
                @input="clearCustomerDialogError"
              />
            </label>

          </div>
        </div>

        <div class="customer-dialog-actions">
          <button
            type="button"
            class="customer-dialog-button customer-dialog-button-secondary"
            :disabled="isSavingCustomerDialog"
            @click="cancelCustomerDialog"
          >
            <span>Abbrechen</span>
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>

          <button
            type="submit"
            class="customer-dialog-button customer-dialog-button-primary"
            :disabled="isSavingCustomerDialog || !canSaveCustomer(customerDraft)"
          >
            <i
              :class="isSavingCustomerDialog ? 'pi pi-spinner pi-spin' : 'pi pi-save'"
              aria-hidden="true"
            ></i>
            <span>{{ customerDialogSaveLabel }}</span>
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { createKalkulationApi } from '../services/kalkulationApi'
import {
  getCustomerValidationError,
  isEmailFormatValid,
  isSwissPhoneFormatValid,
  normalizeSwissPhone
} from '../utils/customerValidation'
import {
  forgetSelectedCustomerId,
  getRememberedSelectedCustomerId,
  rememberSelectedCustomerId
} from '../utils/selectedCustomer'
import { useBodyScrollLock } from '../composables/useBodyScrollLock'

const api = createKalkulationApi()
const LOADING_INDICATOR_DELAY = 140
const DEMO_VERKAEUFER_EMAIL = 'demo.verkaeufer@local'
const CUSTOMER_PAGE_SIZE = 10

const customers = ref([])
const salespeople = ref([])
const isLoadingCustomers = ref(false)
const hasLoadedCustomers = ref(false)
const customerError = ref('')
const customerToDelete = ref(null)
const isDeletingCustomer = ref(false)
const activeCustomerId = ref(getRememberedSelectedCustomerId())
const customerPage = ref(1)
const customerTotal = ref(0)
const customerSearchQuery = ref('')
const appliedCustomerSearchQuery = ref('')
const customerDraft = ref(null)
const customerDialogError = ref('')
const isSavingCustomerDialog = ref(false)
let loadingIndicatorTimer = null
let customerLoadRequestId = 0

const customerTotalPages = computed(() =>
  Math.max(1, Math.ceil(customerTotal.value / CUSTOMER_PAGE_SIZE))
)
const customerRangeStart = computed(() =>
  customerTotal.value === 0 ? 0 : (customerPage.value - 1) * CUSTOMER_PAGE_SIZE + 1
)
const customerRangeEnd = computed(() =>
  Math.min(customerTotal.value, customerPage.value * CUSTOMER_PAGE_SIZE)
)
const isEditingCustomerDialog = computed(() =>
  Boolean(customerDraft.value?.persistedId)
)
const customerDialogTitle = computed(() => {
  if (!isEditingCustomerDialog.value) {
    return 'Neuer Kunde'
  }

  const customerName = String(customerDraft.value?.name ?? '').trim()

  return customerName ? `Kunde bearbeiten: ${customerName}` : 'Kunde bearbeiten'
})
const customerDialogSaveLabel = computed(() =>
  isEditingCustomerDialog.value ? 'Änderungen speichern' : 'Kunde speichern'
)
const isCustomerModalOpen = computed(() =>
  Boolean(customerToDelete.value || customerDraft.value)
)

useBodyScrollLock(isCustomerModalOpen)

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createDraftCustomer() {
  return {
    id: createId(),
    persistedId: null,
    isNew: true,
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    street: '',
    postalCode: '',
    city: '',
    salespersonId: getDemoSalespersonId(),
    original: null
  }
}

function mapApiCustomer(customer) {
  const mappedCustomer = {
    id: customer.id,
    persistedId: customer.id,
    isNew: false,
    isDeleting: false,
    name: customer.firmenname ?? '',
    contactPerson: customer.kontaktname ?? '',
    email: customer.email ?? '',
    phone: customer.telefon ?? '',
    street: customer.strasse ?? '',
    postalCode: customer.plz ?? '',
    city: customer.ort ?? '',
    salespersonId: customer.verkaeuferId ?? '',
    salespersonName: customer.verkaeufer
      ? `${customer.verkaeufer.vorname ?? ''} ${customer.verkaeufer.nachname ?? ''}`.trim()
      : ''
  }

  mappedCustomer.original = createCustomerSnapshot(mappedCustomer)

  return mappedCustomer
}

function createEditableCustomer(customer) {
  return {
    id: createId(),
    persistedId: customer.persistedId,
    isNew: false,
    name: customer.name,
    contactPerson: customer.contactPerson,
    email: customer.email,
    phone: customer.phone,
    street: customer.street,
    postalCode: customer.postalCode,
    city: customer.city,
    salespersonId: customer.salespersonId || '',
    salespersonName: customer.salespersonName || '',
    original: { ...customer.original }
  }
}

function createCustomerSnapshot(customer) {
  return {
    name: customer.name.trim(),
    contactPerson: customer.contactPerson.trim(),
    email: String(customer.email ?? '').trim(),
    phone: normalizeSwissPhone(customer.phone),
    street: customer.street.trim(),
    postalCode: customer.postalCode.trim(),
    city: customer.city.trim(),
    salespersonId: customer.salespersonId || ''
  }
}

function createCustomerPayload(customer) {
  return {
    firmenname: customer.name.trim(),
    kontaktname: customer.contactPerson.trim() || null,
    email: String(customer.email ?? '').trim() || null,
    telefon: normalizeSwissPhone(customer.phone) || null,
    strasse: customer.street.trim() || null,
    plz: customer.postalCode.trim() || null,
    ort: customer.city.trim() || null,
    verkaeuferId: customer.salespersonId || null
  }
}

function formatCustomerValue(value) {
  return String(value ?? '').trim() || '-'
}

function formatCustomerLocation(customer) {
  const location = [customer.postalCode, customer.city]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .join(' ')

  return location || '-'
}

function getCustomerSalespersonName(customer) {
  if (customer.salespersonName) {
    return customer.salespersonName
  }

  const salesperson = salespeople.value.find(
    (entry) => Number(entry.id) === Number(customer.salespersonId)
  )

  return salesperson?.name ?? 'Kein Verkäufer'
}

function isCustomerDirty(customer) {
  if (!customer) {
    return false
  }

  if (customer.isNew) {
    return true
  }

  return JSON.stringify(createCustomerSnapshot(customer)) !== JSON.stringify(customer.original)
}

function canSaveCustomer(customer) {
  return Boolean(
    customer &&
      customer.name.trim() &&
      isCustomerDirty(customer) &&
      isCustomerPostalCodeValid(customer) &&
      !getCustomerValidationError(customer)
  )
}

function isCustomerPostalCodeValid(customer) {
  return /^\d*$/.test(String(customer.postalCode ?? '').trim())
}

function hasCustomerEmailError(customer) {
  const email = String(customer?.email ?? '').trim()

  return Boolean(email && !isEmailFormatValid(email))
}

function hasCustomerPhoneError(customer) {
  const phone = String(customer?.phone ?? '').trim()

  return Boolean(phone && !isSwissPhoneFormatValid(phone))
}

function normalizeCustomerPostalCode(customer) {
  customer.postalCode = String(customer.postalCode ?? '').replace(/\D/g, '')
}

function addCustomer() {
  const customer = createDraftCustomer()
  applyDemoSalesperson(customer)
  customerDraft.value = customer
  customerDialogError.value = ''
}

function editCustomer(customer) {
  rememberCustomerForCalculation(customer)
  customerDraft.value = createEditableCustomer(customer)
  customerDialogError.value = ''
}

function clearCustomerDialogError() {
  customerDialogError.value = ''
}

function handleCustomerDraftPostalCodeInput() {
  if (!customerDraft.value) {
    return
  }

  normalizeCustomerPostalCode(customerDraft.value)
  clearCustomerDialogError()
}

function handleCustomerDraftPhoneBlur() {
  if (!customerDraft.value) {
    return
  }

  customerDraft.value.phone = normalizeSwissPhone(customerDraft.value.phone)
  clearCustomerDialogError()
}

function getCustomerFormError(customer) {
  if (!customer.name.trim()) {
    return 'Bitte Firma erfassen.'
  }

  if (!isCustomerPostalCodeValid(customer)) {
    return 'PLZ darf nur Zahlen enthalten.'
  }

  if (getCustomerValidationError(customer)) {
    return 'Bitte Kundendaten prüfen.'
  }

  return ''
}

function cancelCustomerDialog() {
  if (isSavingCustomerDialog.value) {
    return
  }

  customerDraft.value = null
  customerDialogError.value = ''
}

async function saveCustomerDialog() {
  const customer = customerDraft.value

  if (!customer || isSavingCustomerDialog.value) {
    return
  }

  if (!canSaveCustomer(customer)) {
    customerDialogError.value = getCustomerFormError(customer) || 'Bitte Kundendaten prüfen.'
    return
  }

  isSavingCustomerDialog.value = true
  customerDialogError.value = ''
  customerError.value = ''

  try {
    const savedCustomer = customer.isNew
      ? await api.createKunde(createCustomerPayload(customer))
      : await api.updateKunde(customer.persistedId, createCustomerPayload(customer))
    rememberSelectedCustomerId(savedCustomer.id)
    activeCustomerId.value = Number(savedCustomer.id)

    if (customer.isNew) {
      customerPage.value = 1
    }

    customerDraft.value = null
    await loadCustomers()
  } catch (error) {
    customerDialogError.value = `Kunde konnte nicht gespeichert werden: ${error.message}`
  } finally {
    isSavingCustomerDialog.value = false
  }
}

function filterDemoSalespeople(entries) {
  return entries.filter((salesperson) => salesperson.email === DEMO_VERKAEUFER_EMAIL)
}

function getDemoSalespersonId() {
  return salespeople.value[0]?.id ?? ''
}

function applyDemoSalesperson(customer) {
  const demoSalespersonId = getDemoSalespersonId()

  if (demoSalespersonId && !customer.salespersonId) {
    customer.salespersonId = demoSalespersonId

    if (customer.original) {
      customer.original.salespersonId = demoSalespersonId
    }
  }
}

function applyDemoSalespersonToCustomers() {
  customers.value.forEach(applyDemoSalesperson)
}

function rememberCustomerForCalculation(customer) {
  if (customer.persistedId) {
    rememberSelectedCustomerId(customer.persistedId)
    activeCustomerId.value = Number(customer.persistedId)
  }
}

function isActiveCustomer(customer) {
  return Boolean(
    customer.persistedId &&
      activeCustomerId.value &&
      Number(customer.persistedId) === Number(activeCustomerId.value)
  )
}

function askDeleteCustomer(customer) {
  customerToDelete.value = customer
}

function cancelDeleteCustomer() {
  if (isDeletingCustomer.value) {
    return
  }

  customerToDelete.value = null
}

async function confirmDeleteCustomer() {
  if (!customerToDelete.value || isDeletingCustomer.value) {
    return
  }

  const customer = customerToDelete.value

  customer.isDeleting = true
  isDeletingCustomer.value = true
  customerError.value = ''

  try {
    await api.deleteKunde(customer.persistedId)
    forgetSelectedCustomerId(customer.persistedId)
    if (Number(activeCustomerId.value) === Number(customer.persistedId)) {
      activeCustomerId.value = null
    }
    customerToDelete.value = null
    await loadCustomers()
  } catch (error) {
    customerError.value = `Kunde konnte nicht gelöscht werden: ${error.message}`
  } finally {
    customer.isDeleting = false
    isDeletingCustomer.value = false
  }
}

async function loadCustomers() {
  const requestId = customerLoadRequestId + 1
  customerLoadRequestId = requestId
  const requestedPage = customerPage.value
  const requestedQuery = appliedCustomerSearchQuery.value

  window.clearTimeout(loadingIndicatorTimer)
  loadingIndicatorTimer = window.setTimeout(() => {
    if (requestId === customerLoadRequestId) {
      isLoadingCustomers.value = true
    }
  }, LOADING_INDICATOR_DELAY)
  customerError.value = ''

  try {
    const customerRequest = api.getKunden({
      page: requestedPage,
      pageSize: CUSTOMER_PAGE_SIZE,
      query: requestedQuery
    })
    const salespeopleRequest = salespeople.value.length
      ? Promise.resolve(salespeople.value)
      : api.getVerkaeufer().then(filterDemoSalespeople)
    const [loadedCustomers, loadedSalespeople] = await Promise.all([
      customerRequest,
      salespeopleRequest
    ])

    if (requestId !== customerLoadRequestId) {
      return
    }

    if (
      loadedCustomers.total > 0 &&
      !loadedCustomers.items.length &&
      requestedPage > 1
    ) {
      customerPage.value = Math.max(1, Math.ceil(loadedCustomers.total / CUSTOMER_PAGE_SIZE))
      await loadCustomers()
      return
    }

    customers.value = loadedCustomers.items.map(mapApiCustomer)
    salespeople.value = loadedSalespeople
    customerTotal.value = loadedCustomers.total
    applyDemoSalespersonToCustomers()
    hasLoadedCustomers.value = true

  } catch (error) {
    if (requestId !== customerLoadRequestId) {
      return
    }

    customerError.value = `Kunden konnten nicht geladen werden: ${error.message}`
    customers.value = []
    hasLoadedCustomers.value = true
  } finally {
    if (requestId === customerLoadRequestId) {
      window.clearTimeout(loadingIndicatorTimer)
      isLoadingCustomers.value = false
    }
  }
}

function hydrateCustomersFromCache() {
  return false
}

async function goToPreviousCustomerPage() {
  if (customerPage.value <= 1 || isLoadingCustomers.value) {
    return
  }

  customerPage.value -= 1
  await loadCustomers()
}

async function applyCustomerSearch() {
  const nextSearchQuery = customerSearchQuery.value.trim()

  if (nextSearchQuery === appliedCustomerSearchQuery.value && customerPage.value === 1) {
    return
  }

  appliedCustomerSearchQuery.value = nextSearchQuery
  customerPage.value = 1
  await loadCustomers()
}

function handleCustomerSearchInput() {
  applyCustomerSearch()
}

async function goToNextCustomerPage() {
  if (customerPage.value >= customerTotalPages.value || isLoadingCustomers.value) {
    return
  }

  customerPage.value += 1
  await loadCustomers()
}

const hasHydratedCustomers = hydrateCustomersFromCache()

onMounted(() => {
  if (!hasHydratedCustomers) {
    loadCustomers()
  }
})

onBeforeUnmount(() => {
  window.clearTimeout(loadingIndicatorTimer)
})
</script>

<style scoped>
.customer-page-card-body {
  padding: 0 1rem 1.5rem;
}

.customer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 2.5rem;
  margin: 1.75rem 0 1.35rem;
}

.customers-heading {
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

.customer-search-form {
  display: inline-flex;
  flex: 0 1 18rem;
  align-items: center;
  justify-content: flex-end;
  max-width: 100%;
  min-width: 0;
}

.customer-search-input {
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

.customer-search-input::placeholder {
  color: var(--kt-color-text-light);
}

.customer-search-input:focus {
  position: relative;
  z-index: 1;
  border-color: var(--kt-color-primary-light);
  outline: 0;
  box-shadow: inset 0 0 0 1px var(--kt-color-primary-border-subtle);
}

.customer-search-button {
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

.customer-search-button + .customer-search-button {
  border-left: 0;
}

.customer-search-button-last {
  border-radius: 0 var(--kt-border-radius-sm) var(--kt-border-radius-sm) 0;
}

.customer-search-button:hover:not(:disabled),
.customer-search-button:focus-visible:not(:disabled) {
  background: var(--kt-color-bg-light);
  border-color: var(--kt-color-text-light);
  color: var(--kt-color-text-primary);
}

.customer-search-button:focus-visible {
  position: relative;
  z-index: 1;
  outline: 0;
  box-shadow: inset 0 0 0 1px var(--kt-color-primary-border-subtle);
}

.customer-search-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.customers-table-responsive {
  border: 1px solid var(--kt-color-border);
  border-radius: var(--kt-border-radius-sm);
  overflow-x: auto;
}

.customers-table {
  width: 100%;
  min-width: 58rem;
  margin-bottom: 0;
  border-style: hidden;
  table-layout: fixed;
}

.customers-table thead th {
  background-color: var(--kt-color-bg-light);
  border-bottom: 1px solid var(--kt-color-border-light);
  color: var(--kt-color-text-primary);
  font-size: var(--kt-font-size-sm);
  font-weight: 500;
  line-height: var(--kt-line-height-tight);
  vertical-align: middle;
  white-space: nowrap;
}

.customers-table tbody td {
  background-color: var(--kt-color-bg-white);
  border-color: var(--kt-color-border);
}

.customers-table tbody .customer-table-row:hover td {
  background-color: var(--kt-color-bg-light);
}

.customers-table.table-bordered > :not(caption) > * > * {
  border-color: var(--kt-color-border);
}

.customers-table th,
.customers-table td {
  min-width: 0;
  padding: 0.32rem;
  vertical-align: middle;
}

.customers-table th:nth-child(1),
.customers-table td:nth-child(1) {
  width: 26%;
}

.customers-table th:nth-child(2),
.customers-table td:nth-child(2) {
  width: 20%;
}

.customers-table th:nth-child(3),
.customers-table td:nth-child(3) {
  width: 24%;
}

.customers-table th:nth-child(4),
.customers-table td:nth-child(4) {
  width: 14%;
}

.customers-table th:nth-child(5),
.customers-table td:nth-child(5) {
  width: 11%;
}

.customers-table th:nth-child(6),
.customers-table td:nth-child(6) {
  width: 5.1rem;
  min-width: 5.1rem;
  max-width: 5.1rem;
  text-align: center;
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

.postal-code-control-field {
  font-variant-numeric: tabular-nums;
}

.customer-action-buttons {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
}

.customers-table .table-edit-button,
.customers-table .table-delete-button {
  width: 1.75rem;
  height: 1.75rem;
}

.customers-table .table-edit-button .pi,
.customers-table .table-delete-button .pi {
  font-size: 0.95rem;
}

.customer-empty-table-row td {
  padding: 0.8rem 1rem;
}

.customer-empty-table-text {
  color: var(--kt-color-text-tertiary);
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  text-align: center;
}

.customer-add-table-row td {
  padding: 0.68rem 1.45rem;
  border-top: 1px solid var(--kt-color-border-light);
  background: var(--kt-color-bg-light);
}

.customer-add-content {
  display: flex;
  align-items: center;
  gap: 1.35rem;
  width: 100%;
}

.customer-add-content::before,
.customer-add-content::after {
  content: '';
  flex: 1 1 0;
  max-width: 38rem;
  border-top: 1px solid var(--kt-color-border);
  opacity: 0.85;
}

.customer-add-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 2.25rem;
  padding: 0 0.55rem;
  border: 0;
  border-radius: 0.25rem;
  background: transparent;
  color: var(--kt-color-text-secondary);
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: var(--kt-line-height-tight);
  white-space: nowrap;
}

.customer-add-button .pi {
  font-size: 1rem;
}

.customer-add-button:hover,
.customer-add-button:focus-visible {
  background: var(--kt-color-bg-very-light);
  color: var(--kt-color-primary);
}

.customer-add-button:focus-visible {
  border-radius: 0.2rem;
  outline: 2px solid var(--kt-color-primary-border-subtle);
  outline-offset: 0.2rem;
}

.customer-pagination {
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

.customer-pagination-summary,
.customer-pagination-page {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.customer-pagination-controls {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.55rem;
}

.customer-pagination-button {
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

.customer-pagination-button:hover:not(:disabled),
.customer-pagination-button:focus-visible:not(:disabled) {
  border-color: var(--kt-color-text-light);
  background: var(--kt-color-bg-light);
  color: var(--kt-color-text-primary);
}

.customer-pagination-button:focus-visible {
  outline: 2px solid var(--kt-color-primary-border-subtle);
  outline-offset: 0.18rem;
}

.customer-pagination-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.customer-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1110;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(var(--bs-dark-rgb), 0.46);
  backdrop-filter: blur(0.15rem);
}

.customer-dialog {
  display: grid;
  gap: 1rem;
  width: min(42rem, 100%);
  max-height: min(44rem, calc(100vh - 2rem));
  padding: 1.25rem;
  border: 1px solid var(--kt-color-border);
  border-radius: 0.42rem;
  background: var(--kt-color-bg-white);
  box-shadow: 0 1.5rem 4rem rgba(var(--bs-dark-rgb), 0.24);
  overflow-y: auto;
}

.customer-dialog-content {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.customer-dialog-title {
  margin: 0;
  color: var(--kt-color-text-primary);
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.25;
}

.customer-dialog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.customer-dialog-field {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
  color: var(--kt-color-text-secondary);
  font-size: var(--kt-font-size-sm);
  font-weight: 600;
  line-height: var(--kt-line-height-tight);
}

.customer-dialog-field-wide {
  grid-column: 1 / -1;
}

.customer-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 0.3rem;
}

.customer-dialog-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0.58rem 1.15rem;
  border-radius: var(--kt-border-radius-sm);
  font-size: var(--kt-font-size-md);
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  transition:
    background-color var(--kt-transition-fast),
    border-color var(--kt-transition-fast),
    color var(--kt-transition-fast);
}

.customer-dialog-button-secondary {
  border: 1px solid var(--kt-color-border);
  background: var(--kt-color-bg-white);
  color: var(--kt-color-text-secondary);
}

.customer-dialog-button-secondary:hover:not(:disabled),
.customer-dialog-button-secondary:focus-visible:not(:disabled) {
  background: var(--kt-color-bg-light);
  border-color: var(--kt-color-text-light);
}

.customer-dialog-button-primary {
  min-width: 11.5rem;
  border: 1px solid var(--kt-color-primary);
  background: var(--kt-color-primary);
  color: var(--kt-color-bg-white);
}

.customer-dialog-button-primary:hover:not(:disabled),
.customer-dialog-button-primary:focus-visible:not(:disabled) {
  border-color: var(--kt-color-primary-dark);
  background: var(--kt-color-primary-dark);
}

.customer-dialog-button:focus-visible {
  outline: 2px solid var(--kt-color-primary-border-subtle);
  outline-offset: 0.2rem;
}

.customer-dialog-button-secondary:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.customer-dialog-button-primary:disabled {
  border-color: var(--kt-color-border);
  background: var(--kt-color-bg-light);
  color: var(--kt-color-text-light);
  cursor: not-allowed;
  opacity: 1;
}

.confirm-delete-backdrop {
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

.confirm-delete-dialog {
  display: grid;
  gap: 1rem;
  width: min(31rem, 100%);
  padding: 1.25rem;
  border: 1px solid var(--kt-color-border);
  border-radius: 0.42rem;
  background: var(--kt-color-bg-white);
  box-shadow: 0 1.5rem 4rem rgba(var(--bs-dark-rgb), 0.24);
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
  color: var(--kt-color-text-tertiary);
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
  border: 1px solid var(--kt-color-border);
  background: var(--kt-color-bg-white);
  color: var(--kt-color-text-secondary);
}

.confirm-delete-button-secondary:hover:not(:disabled),
.confirm-delete-button-secondary:focus-visible:not(:disabled) {
  background: var(--kt-color-bg-light);
  border-color: var(--kt-color-text-light);
}

.confirm-delete-button-danger {
  border: 1px solid var(--kt-color-error);
  background: var(--kt-color-error);
  color: var(--kt-color-bg-white);
}

.confirm-delete-button-danger:hover:not(:disabled),
.confirm-delete-button-danger:focus-visible:not(:disabled) {
  border-color: var(--kt-color-error-dark);
  background: var(--kt-color-error-dark);
}

.confirm-delete-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 1199.98px) {
  .customer-page-card-body {
    padding-right: 1rem;
    padding-left: 1rem;
  }
}

@media (max-width: 575.98px) {
  .customer-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .customer-search-form {
    width: 100%;
  }

  .customer-search-input {
    min-width: 0;
  }

  .customer-dialog-grid {
    grid-template-columns: 1fr;
  }

  .customer-dialog-actions {
    flex-direction: column-reverse;
  }

  .customer-dialog-button {
    width: 100%;
  }
}
</style>
