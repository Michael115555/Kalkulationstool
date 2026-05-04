/**
 * Katalog-Caching für Performance
 */

let cachedKatalog = null
let lastCacheTime = null
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 Minuten

/**
 * Gibt true zurück, wenn der Cache noch gültig ist
 */
const isCacheValid = () => {
  if (!cachedKatalog || !lastCacheTime) return false
  return Date.now() - lastCacheTime < CACHE_TTL_MS
}

/**
 * Setzt den Katalog-Cache
 */
const setCatalogCache = (katalog) => {
  cachedKatalog = katalog
  lastCacheTime = Date.now()
}

/**
 * Gibt den Katalog-Cache zurück, oder null wenn ungültig
 */
const getCatalogCache = () => {
  return isCacheValid() ? cachedKatalog : null
}

module.exports = {
  getCatalogCache,
  setCatalogCache,
  isCacheValid
}
