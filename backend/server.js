const http = require('node:http')
const { URL } = require('node:url')
const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const {
  validateInteger,
  validateKundePayload,
  validateKonfigurationPayload,
  ApiError
} = require('./validators')
const { getCatalogCache, setCatalogCache } = require('./catalogCache')

const prisma = new PrismaClient()
const port = Number(process.env.PORT || 3001)
const MAX_JSON_BODY_BYTES = 1024 * 1024

const amountFromDb = (value) => Number(value ?? 0) / 100
const amountToDb = (value) => Math.round(Number(value ?? 0) * 100)

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': process.env.FRONTEND_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  })
  response.end(JSON.stringify(payload))
}

const readJsonBody = (request) =>
  new Promise((resolve, reject) => {
    let body = ''
    let bodyBytes = 0
    let hasRejected = false

    request.on('data', (chunk) => {
      bodyBytes += chunk.length

      if (bodyBytes > MAX_JSON_BODY_BYTES) {
        hasRejected = true
        reject(new ApiError('Request Body ist zu gross', 413))
        request.destroy()
        return
      }

      body += chunk
    })
    request.on('end', () => {
      if (hasRejected) {
        return
      }

      if (!body.trim()) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(body))
      } catch (error) {
        reject(new ApiError('Ungueltiges JSON im Request Body', 400))
      }
    })
    request.on('error', (error) => {
      if (!hasRejected) {
        reject(error)
      }
    })
  })

const getKatalog = async () => {
  // Cache prüfen
  const cachedKatalog = getCatalogCache()
  if (cachedKatalog) {
    return cachedKatalog
  }

  const [
    druckermodelle,
    zubehoerKategorien,
    lieferungOptionen,
    mietansaetze,
    epFaktorGruppen
  ] = await Promise.all([
    prisma.druckermodell.findMany({
      orderBy: [{ hersteller: { name: 'asc' } }, { name: 'asc' }],
      include: {
        hersteller: true,
        epFaktorGruppe: true,
        varianten: {
          orderBy: { bezeichnung: 'asc' }
        },
        zubehoer: {
          include: {
            zubehoer: {
              include: {
                kategorie: {
                  include: {
                    epFaktorKategorie: true
                  }
                }
              }
            }
          },
          orderBy: {
            zubehoer: {
              name: 'asc'
            }
          }
        }
      }
    }),
    prisma.zubehoerKategorie.findMany({
      orderBy: { name: 'asc' },
      include: {
        epFaktorKategorie: true
      }
    }),
    prisma.lieferOption.findMany({
      orderBy: [{ sortierung: 'asc' }, { label: 'asc' }]
    }),
    prisma.mietLaufzeit.findMany({
      orderBy: { monate: 'asc' }
    }),
    prisma.epFaktorGruppe.findMany({
      orderBy: { name: 'asc' },
      include: {
        werte: {
          include: {
            kategorie: true
          }
        }
      }
    })
  ])

  const katalog = {
    druckermodelle: druckermodelle.map((modell) => ({
      id: modell.id,
      name: modell.name,
      hersteller: modell.hersteller.name,
      epFaktorGruppe: modell.epFaktorGruppe?.name ?? null,
      varianten: modell.varianten.map((variante) => ({
        id: variante.id,
        bezeichnung: variante.bezeichnung,
        geschwindigkeit: variante.geschwindigkeit,
        verkaufsPreis: amountFromDb(variante.verkaufsPreis),
        einkaufsPreis:
          variante.einkaufsPreis === null ? null : amountFromDb(variante.einkaufsPreis)
      })),
      zubehoer: modell.zubehoer.map(({ zubehoer }) => ({
        id: zubehoer.id,
        zubehoer: zubehoer.kategorie.name,
        bezeichnung: zubehoer.name,
        artikelnummer: zubehoer.artikelnummer,
        vp: amountFromDb(zubehoer.verkaufsPreis),
        einkaufsPreis:
          zubehoer.einkaufsPreis === null ? null : amountFromDb(zubehoer.einkaufsPreis),
        epKategorie: zubehoer.kategorie.epFaktorKategorie?.name ?? 'optionen'
      }))
    })),
    zubehoerKategorien: zubehoerKategorien.map((kategorie) => ({
      id: kategorie.id,
      name: kategorie.name,
      epKategorie: kategorie.epFaktorKategorie?.name ?? 'optionen'
    })),
    lieferungOptionen: lieferungOptionen.map((option) => ({
      id: option.id,
      value: option.value,
      label: option.label,
      betrag: amountFromDb(option.betrag)
    })),
    mietansaetze: Object.fromEntries(
      mietansaetze.map((laufzeit) => [laufzeit.monate, laufzeit.mietansatz])
    ),
    epFaktoren: Object.fromEntries(
      epFaktorGruppen.map((gruppe) => [
        gruppe.name,
        Object.fromEntries(
          gruppe.werte.map((wert) => [wert.kategorie.name, wert.faktorBasisPunkte / 10000])
        )
      ])
    )
  }

  // Cache speichern
  setCatalogCache(katalog)
  return katalog
}

const getHealth = async () => {
  await prisma.$queryRaw`SELECT 1`

  return {
    ok: true
  }
}

const serializeKunde = (kunde) => ({
  id: kunde.id,
  firmenname: kunde.firmenname,
  kontaktname: kunde.kontaktname,
  email: kunde.email,
  telefon: kunde.telefon,
  ort: kunde.ort,
  kontaktart: kunde.kontaktart,
  versandart: kunde.versandart,
  verkaeuferId: kunde.verkaeuferId,
  verkaeufer: kunde.verkaeufer
    ? {
        id: kunde.verkaeufer.id,
        vorname: kunde.verkaeufer.vorname,
        nachname: kunde.verkaeufer.nachname,
        email: kunde.verkaeufer.email
      }
    : null
})

const getKunden = async () => {
  const kunden = await prisma.kunde.findMany({
    orderBy: { firmenname: 'asc' },
    include: {
      verkaeufer: true
    }
  })

  return kunden.map(serializeKunde)
}

const createKunde = async (payload) => {
  const validated = validateKundePayload(payload)

  const kunde = await prisma.kunde.create({
    data: {
      firmenname: validated.firmenname,
      kontaktname: validated.kontaktname,
      email: validated.email,
      telefon: validated.telefon,
      ort: validated.ort,
      kontaktart: validated.kontaktart,
      versandart: validated.versandart,
      verkaeuferId: validated.verkaeuferId
    },
    include: {
      verkaeufer: true
    }
  })

  return serializeKunde(kunde)
}

const updateKunde = async (id, payload) => {
  validateInteger(id, 'Kunde ID')
  const validated = validateKundePayload(payload)

  const kunde = await prisma.kunde.update({
    where: { id },
    data: {
      firmenname: validated.firmenname,
      kontaktname: validated.kontaktname,
      email: validated.email,
      telefon: validated.telefon,
      ort: validated.ort,
      kontaktart: validated.kontaktart,
      versandart: validated.versandart,
      verkaeuferId: validated.verkaeuferId
    },
    include: {
      verkaeufer: true
    }
  })

  return serializeKunde(kunde)
}

const deleteKunde = async (id) => {
  validateInteger(id, 'Kunde ID')
  
  // Prüfen, ob der Kunde in Verwendung ist
  const offerteCount = await prisma.offerte.count({
    where: { kundeId: id }
  })
  
  if (offerteCount > 0) {
    throw new ApiError(
      `Kunde kann nicht gelöscht werden, da ${offerteCount} Offerte(n) damit verbunden sind`,
      400
    )
  }

  await prisma.kunde.delete({
    where: { id }
  })
}

const serializeVerkaeufer = (benutzer) => ({
  id: benutzer.id,
  vorname: benutzer.vorname,
  nachname: benutzer.nachname,
  email: benutzer.email,
  name: `${benutzer.vorname} ${benutzer.nachname}`.trim()
})

const getVerkaeufer = async () => {
  const benutzer = await prisma.benutzer.findMany({
    where: {
      aktiv: true,
      rolle: 'VERKAUF'
    },
    orderBy: [{ nachname: 'asc' }, { vorname: 'asc' }]
  })

  return benutzer.map(serializeVerkaeufer)
}

const parseSnapshot = (konfiguration) => {
  try {
    return JSON.parse(konfiguration.snapshotJson)
  } catch (error) {
    console.warn(`Konfiguration ${konfiguration.id} enthaelt ungueltiges Snapshot JSON`)
    return {}
  }
}

const serializeKonfiguration = (konfiguration) => ({
  id: konfiguration.id,
  name: konfiguration.name,
  kundeId: konfiguration.kundeId,
  druckermodellId: konfiguration.druckermodellId,
  druckerVarianteId: konfiguration.druckerVarianteId,
  total: amountFromDb(konfiguration.total),
  calculation: {
    ...parseSnapshot(konfiguration),
    kundeId: konfiguration.kundeId ?? null
  },
  aktualisiertAm: konfiguration.aktualisiertAm
})

const serializeProjektSummary = (konfiguration) => {
  const calculation = parseSnapshot(konfiguration)
  const positions = Array.isArray(calculation.positions) ? calculation.positions : []

  return {
    id: konfiguration.id,
    name: konfiguration.name,
    kundeId: konfiguration.kundeId,
    druckermodellId: konfiguration.druckermodellId,
    druckerVarianteId: konfiguration.druckerVarianteId,
    total: amountFromDb(konfiguration.total),
    positionsCount: positions.filter((position) => position.zubehoer || position.bezeichnung)
      .length,
    calculation: {
      kundeId: konfiguration.kundeId ?? null,
      druckermodell: calculation.druckermodell ?? '',
      variante: calculation.variante ?? '',
      kundeName: calculation.kundeName ?? null,
      verkaeuferId: calculation.verkaeuferId ?? null
    },
    aktualisiertAm: konfiguration.aktualisiertAm
  }
}

const getKonfigurationen = async () => {
  const konfigurationen = await prisma.konfiguration.findMany({
    orderBy: [{ druckermodellId: 'asc' }, { erstelltAm: 'asc' }]
  })

  return konfigurationen.map(serializeKonfiguration)
}

const getProjekte = async () => {
  const konfigurationen = await prisma.konfiguration.findMany({
    orderBy: [{ druckermodellId: 'asc' }, { erstelltAm: 'asc' }]
  })

  return konfigurationen.map(serializeProjektSummary)
}

const createKonfiguration = async (payload) => {
  const validated = validateKonfigurationPayload(payload)
  
  const calculation = {
    ...validated.calculation,
    kundeId: validated.kundeId
  }
  
  const konfiguration = await prisma.konfiguration.create({
    data: {
      name: validated.name,
      kundeId: validated.kundeId,
      druckermodellId: validated.druckermodellId,
      druckerVarianteId: validated.druckerVarianteId,
      total: amountToDb(validated.total),
      snapshotJson: JSON.stringify(calculation)
    }
  })

  return serializeKonfiguration(konfiguration)
}

const updateKonfiguration = async (id, payload) => {
  validateInteger(id, 'Konfiguration ID')
  const validated = validateKonfigurationPayload(payload)
  
  const calculation = {
    ...validated.calculation,
    kundeId: validated.kundeId
  }
  
  const konfiguration = await prisma.konfiguration.update({
    where: { id },
    data: {
      name: validated.name,
      kundeId: validated.kundeId,
      druckermodellId: validated.druckermodellId,
      druckerVarianteId: validated.druckerVarianteId,
      total: amountToDb(validated.total),
      snapshotJson: JSON.stringify(calculation)
    }
  })

  return serializeKonfiguration(konfiguration)
}

const handleRequest = async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`)

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {})
    return
  }

  try {
    if (request.method === 'GET' && url.pathname === '/api/health') {
      sendJson(response, 200, await getHealth())
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/katalog') {
      sendJson(response, 200, await getKatalog())
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/kunden') {
      sendJson(response, 200, await getKunden())
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/verkaeufer') {
      sendJson(response, 200, await getVerkaeufer())
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/projekte') {
      sendJson(response, 200, await getProjekte())
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/kunden') {
      sendJson(response, 201, await createKunde(await readJsonBody(request)))
      return
    }

    const kundeMatch = url.pathname.match(/^\/api\/kunden\/(\d+)$/)

    if (kundeMatch && request.method === 'PUT') {
      sendJson(response, 200, await updateKunde(Number(kundeMatch[1]), await readJsonBody(request)))
      return
    }

    if (kundeMatch && request.method === 'DELETE') {
      await deleteKunde(Number(kundeMatch[1]))
      sendJson(response, 200, { ok: true })
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/konfigurationen') {
      sendJson(response, 200, await getKonfigurationen())
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/konfigurationen') {
      sendJson(response, 201, await createKonfiguration(await readJsonBody(request)))
      return
    }

    const konfigurationMatch = url.pathname.match(/^\/api\/konfigurationen\/(\d+)$/)

    if (konfigurationMatch && request.method === 'PUT') {
      sendJson(
        response,
        200,
        await updateKonfiguration(Number(konfigurationMatch[1]), await readJsonBody(request))
      )
      return
    }

    if (konfigurationMatch && request.method === 'DELETE') {
      await prisma.konfiguration.delete({
        where: { id: Number(konfigurationMatch[1]) }
      })
      sendJson(response, 200, { ok: true })
      return
    }

    sendJson(response, 404, { error: 'Nicht gefunden' })
  } catch (error) {
    console.error('API Error:', {
      path: url.pathname,
      method: request.method,
      message: error.message,
      stack: error.stack
    })

    // ApiError mit eigenem statusCode
    if (error instanceof ApiError) {
      sendJson(response, error.statusCode, { error: error.message })
      return
    }

    // Prisma Unique Constraint Violation
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] ?? 'Feld'
      sendJson(response, 400, { error: `${field} existiert bereits` })
      return
    }

    // Prisma Record Not Found
    if (error.code === 'P2025') {
      sendJson(response, 404, { error: 'Datensatz nicht gefunden' })
      return
    }

    // Prisma Foreign Key Constraint
    if (error.code === 'P2003') {
      sendJson(response, 400, { error: 'Referenzierte Datensatz existiert nicht' })
      return
    }

    // Allgemeiner Fehler
    sendJson(response, 500, { error: error.message || 'Interner Serverfehler' })
  }
}

const server = http.createServer(handleRequest)

server.listen(port, () => {
  console.log(`Kalkulation API laeuft auf http://localhost:${port}`)
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  server.close(() => process.exit(0))
})
