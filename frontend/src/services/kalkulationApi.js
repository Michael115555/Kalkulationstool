const DEFAULT_API_BASE_URL = 'http://localhost:3001'

export const createKalkulationApi = (
  baseUrl = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
) => {
  const requestJson = async (path, options = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {})
      },
      ...options
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload.error ?? `API-Fehler ${response.status}`)
    }

    if (response.status === 204) {
      return null
    }

    return response.json()
  }

  return {
    getKatalog: () => requestJson('/api/katalog'),
    getKunden: () => requestJson('/api/kunden'),
    getVerkaeufer: () => requestJson('/api/verkaeufer'),
    createKunde: (payload) =>
      requestJson('/api/kunden', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    updateKunde: (id, payload) =>
      requestJson(`/api/kunden/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),
    deleteKunde: (id) =>
      requestJson(`/api/kunden/${id}`, {
        method: 'DELETE'
      }),
    getKonfigurationen: () => requestJson('/api/konfigurationen'),
    createKonfiguration: (payload) =>
      requestJson('/api/konfigurationen', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    updateKonfiguration: (id, payload) =>
      requestJson(`/api/konfigurationen/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),
    deleteKonfiguration: (id) =>
      requestJson(`/api/konfigurationen/${id}`, {
        method: 'DELETE'
      })
  }
}
