const SELECTED_CUSTOMER_KEY = 'kalkulationstool.selectedCustomerId'

export const rememberSelectedCustomerId = (customerId) => {
  if (typeof window === 'undefined' || !customerId) {
    return
  }

  window.localStorage.setItem(SELECTED_CUSTOMER_KEY, String(customerId))
}

export const getRememberedSelectedCustomerId = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const customerId = Number(window.localStorage.getItem(SELECTED_CUSTOMER_KEY))

  return Number.isFinite(customerId) && customerId > 0 ? customerId : null
}

export const forgetSelectedCustomerId = (customerId) => {
  if (typeof window === 'undefined' || !customerId) {
    return
  }

  if (Number(window.localStorage.getItem(SELECTED_CUSTOMER_KEY)) === Number(customerId)) {
    window.localStorage.removeItem(SELECTED_CUSTOMER_KEY)
  }
}
