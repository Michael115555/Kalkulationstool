/**
 * Katalog-Caching für Performance
 */

let cachedKatalog = null
let lastCacheTime = null
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 Minuten

/**
 * Gibt einen Cache-Schlüssel zurück, der auf den Änderungsstand basiert
 */
const getCacheKey = async (prisma) => {
  const counts = await Promise.all([
    prisma.druckermodell.count(),
    prisma.zubehoerKategorie.count(),
    prisma.lieferOption.count(),
    prisma.mietLaufzeit.count(),
    prisma.epFaktorGruppe.count()
  ])
  
  return counts.join('-')
}

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

/**
 * Invalidiert den Katalog-Cache
 */
const invalidateCatalogCache = () => {
  cachedKatalog = null
  lastCacheTime = null
}

module.exports = {
  getCatalogCache,
  setCatalogCache,
  invalidateCatalogCache,
  isCacheValid
}
