const DEFAULT_API_BASE_URL = 'http://localhost:3001'

const responseCache = new Map()
const pendingRequests = new Map()

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  const queryString = searchParams.toString()

  return queryString ? `?${queryString}` : ''
}

export const createKalkulationApi = (
  baseUrl = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
) => {
  const getCacheKey = (path, method = 'GET') => `${baseUrl} ${method} ${path}`

  const getCachedResponse = (path, method = 'GET') =>
    responseCache.get(getCacheKey(path, method))

  const clearCache = (paths) => {
    const clearMatchingEntries = (store) => {
      Array.from(store.keys()).forEach((key) => {
        const shouldClear = paths.some((path) =>
          key.startsWith(getCacheKey(path))
        )

        if (shouldClear) {
          store.delete(key)
        }
      })
    }

    clearMatchingEntries(responseCache)
    clearMatchingEntries(pendingRequests)
  }

  const listPath = (path, params) => {
    const queryString = buildQueryString(params)

    return `${path}${queryString}`
  }

  const clearCustomerCache = () => {
    clearCache(['/api/kunden', '/api/projekte', '/api/konfigurationen'])
  }

  const clearProjectCache = () => {
    clearCache(['/api/projekte', '/api/konfigurationen'])
  }

  const requestJson = async (path, options = {}) => {
    const method = (options.method ?? 'GET').toUpperCase()
    const cacheKey = getCacheKey(path, method)

    if (method === 'GET') {
      if (responseCache.has(cacheKey)) {
        return responseCache.get(cacheKey)
      }

      if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey)
      }
    }

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

    const payload = await response.json()

    if (method === 'GET') {
      responseCache.set(cacheKey, payload)
    }

    return payload
  }

  const cachedRequestJson = (path, options = {}) => {
    const method = (options.method ?? 'GET').toUpperCase()

    if (method !== 'GET') {
      return requestJson(path, options)
    }

    const cacheKey = getCacheKey(path, method)
    const request = requestJson(path, options).finally(() => {
      pendingRequests.delete(cacheKey)
    })

    pendingRequests.set(cacheKey, request)

    return request
  }

  const prefetchPaths = (paths) =>
    Promise.allSettled(paths.map((path) => cachedRequestJson(path)))

  return {
    getKatalog: () => cachedRequestJson('/api/katalog'),
    getKunden: (params) => cachedRequestJson(listPath('/api/kunden', params)),
    getVerkaeufer: () => cachedRequestJson('/api/verkaeufer'),
    createKunde: (payload) =>
      requestJson('/api/kunden', {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then((kunde) => {
        clearCustomerCache()
        return kunde
      }),
    updateKunde: (id, payload) =>
      requestJson(`/api/kunden/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then((kunde) => {
        clearCustomerCache()
        return kunde
      }),
    deleteKunde: (id) =>
      requestJson(`/api/kunden/${id}`, {
        method: 'DELETE'
      }).then((result) => {
        clearCustomerCache()
        return result
      }),
    getKonfigurationen: () => cachedRequestJson('/api/konfigurationen'),
    getKonfiguration: (id) => cachedRequestJson(`/api/konfigurationen/${id}`),
    getProjekte: (params) => cachedRequestJson(listPath('/api/projekte', params)),
    createKonfiguration: (payload) =>
      requestJson('/api/konfigurationen', {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then((konfiguration) => {
        clearProjectCache()
        return konfiguration
      }),
    updateKonfiguration: (id, payload) =>
      requestJson(`/api/konfigurationen/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then((konfiguration) => {
        clearProjectCache()
        return konfiguration
      }),
    deleteKonfiguration: (id) =>
      requestJson(`/api/konfigurationen/${id}`, {
        method: 'DELETE'
      }).then((result) => {
        clearProjectCache()
        return result
      }),
    getCachedRouteData: (routeName) => {
      if (routeName === 'stammdaten') {
        const kunden = getCachedResponse('/api/kunden')
        const verkaeufer = getCachedResponse('/api/verkaeufer')

        return kunden && verkaeufer
          ? { kunden, verkaeufer }
          : null
      }

      if (routeName === 'projekte') {
        const projekte = getCachedResponse('/api/projekte')
        const kunden = getCachedResponse('/api/kunden')
        const verkaeufer = getCachedResponse('/api/verkaeufer')

        return projekte && kunden && verkaeufer
          ? { projekte, kunden, verkaeufer }
          : null
      }

      if (routeName === 'projektEditor') {
        const katalog = getCachedResponse('/api/katalog')
        const kunden = getCachedResponse('/api/kunden')
        const konfigurationen = getCachedResponse('/api/konfigurationen')

        return katalog && kunden && konfigurationen
          ? { katalog, kunden, konfigurationen }
          : null
      }

      return null
    },
    prefetchRouteData: (routeName) => {
      if (routeName === 'stammdaten') {
        return prefetchPaths(['/api/kunden?page=1&pageSize=10', '/api/verkaeufer'])
      }

      if (routeName === 'projekte') {
        return prefetchPaths(['/api/projekte?page=1&pageSize=10'])
      }

      if (routeName === 'projektEditor') {
        return prefetchPaths(['/api/katalog', '/api/kunden', '/api/konfigurationen'])
      }

      return Promise.resolve([])
    }
  }
}
