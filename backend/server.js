const http = require('node:http')
const { URL } = require('node:url')
const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const {
  validateInteger,
  validateKundePayload,
  validateKonfigurationPayload,
  validateOfferteUnterschriebenPayload,
  validateRechnungErstellenPayload,
  ApiError
} = require('./validators')
const { getCatalogCache, setCatalogCache } = require('./catalogCache')

const prisma = new PrismaClient()
const port = Number(process.env.PORT || 3001)
const MAX_JSON_BODY_BYTES = 3 * 1024 * 1024
const DEMO_VERKAEUFER_EMAIL = 'demo.verkaeufer@local'
const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 100

const amountFromDb = (value) => Number(value ?? 0) / 100
const amountToDb = (value) => Math.round(Number(value ?? 0) * 100)

const parsePositiveQueryInteger = (searchParams, name, fallback) => {
  const value = searchParams.get(name)

  if (value === null || value === '') {
    return fallback
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(`${name} muss eine positive Ganzzahl sein`, 400)
  }

  return parsed
}

const getListQuery = (url) => {
  const page = parsePositiveQueryInteger(url.searchParams, 'page', 1)
  const requestedPageSize = parsePositiveQueryInteger(
    url.searchParams,
    'pageSize',
    DEFAULT_PAGE_SIZE
  )
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)
  const query = String(url.searchParams.get('query') ?? '').trim()
  const enabled =
    url.searchParams.has('page') ||
    url.searchParams.has('pageSize') ||
    url.searchParams.has('query')

  if (query.length > 100) {
    throw new ApiError('query ist zu lang (Maximum 100 Zeichen)', 400)
  }

  return {
    enabled,
    page,
    pageSize,
    query
  }
}

const createPage = ({ items, total, page, pageSize }) => ({
  items,
  total,
  page,
  pageSize
})

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': process.env.FRONTEND_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  })
  response.end(JSON.stringify(payload))
}

const sendPdf = (response, pdfBytes, filename) => {
  response.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="${filename}"`,
    'Content-Length': pdfBytes.length,
    'Cache-Control': 'private, no-store',
    'Access-Control-Allow-Origin': process.env.FRONTEND_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  })
  response.end(pdfBytes)
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
  strasse: kunde.strasse,
  plz: kunde.plz,
  ort: kunde.ort,
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

const createKundenWhere = (query) => {
  if (!query) {
    return {}
  }

  return {
    OR: [
      { firmenname: { contains: query } },
      { kontaktname: { contains: query } },
      { strasse: { contains: query } },
      { plz: { contains: query } },
      { ort: { contains: query } },
      {
        verkaeufer: {
          is: {
            OR: [
              { vorname: { contains: query } },
              { nachname: { contains: query } }
            ]
          }
        }
      }
    ]
  }
}

const getKunden = async (options = {}) => {
  const where = createKundenWhere(options.query)

  if (options.paginated) {
    const [total, kunden] = await prisma.$transaction([
      prisma.kunde.count({ where }),
      prisma.kunde.findMany({
        where,
        orderBy: { firmenname: 'asc' },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
        include: {
          verkaeufer: true
        }
      })
    ])

    return createPage({
      items: kunden.map(serializeKunde),
      total,
      page: options.page,
      pageSize: options.pageSize
    })
  }

  const kunden = await prisma.kunde.findMany({
    where,
    orderBy: { firmenname: 'asc' },
    include: {
      verkaeufer: true
    }
  })

  return kunden.map(serializeKunde)
}

const getDemoVerkaeuferId = async () => {
  const demoVerkaeufer = await prisma.benutzer.findUnique({
    where: { email: DEMO_VERKAEUFER_EMAIL },
    select: { id: true }
  })

  return demoVerkaeufer?.id ?? null
}

const createKunde = async (payload) => {
  const validated = validateKundePayload(payload)
  const demoVerkaeuferId = await getDemoVerkaeuferId()

  const kunde = await prisma.kunde.create({
    data: {
      firmenname: validated.firmenname,
      kontaktname: validated.kontaktname,
      email: validated.email,
      telefon: validated.telefon,
      strasse: validated.strasse,
      plz: validated.plz,
      ort: validated.ort,
      verkaeuferId: demoVerkaeuferId
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
  const demoVerkaeuferId = await getDemoVerkaeuferId()

  const kunde = await prisma.kunde.update({
    where: { id },
    data: {
      firmenname: validated.firmenname,
      kontaktname: validated.kontaktname,
      email: validated.email,
      telefon: validated.telefon,
      strasse: validated.strasse,
      plz: validated.plz,
      ort: validated.ort,
      verkaeuferId: demoVerkaeuferId
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
      rolle: 'VERKAUF',
      email: DEMO_VERKAEUFER_EMAIL
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
  kunde: konfiguration.kunde ? serializeKunde(konfiguration.kunde) : null,
  verkaeufer: konfiguration.kunde?.verkaeufer
    ? serializeVerkaeufer(konfiguration.kunde.verkaeufer)
    : null,
  druckermodellId: konfiguration.druckermodellId,
  druckerVarianteId: konfiguration.druckerVarianteId,
  total: amountFromDb(konfiguration.total),
  calculation: {
    ...parseSnapshot(konfiguration),
    kundeId: konfiguration.kundeId ?? null
  },
  offerteErstelltAm: konfiguration.offerteErstelltAm ?? null,
  offerteUnterschrieben: Boolean(konfiguration.offerteUnterschrieben),
  offerteUnterschriebenAm: konfiguration.offerteUnterschriebenAm ?? null,
  offerteUnterschriebenVonId: konfiguration.offerteUnterschriebenVonId ?? null,
  rechnungErstellt: Boolean(
    konfiguration.offerteUnterschrieben && konfiguration.rechnungErstelltAm
  ),
  rechnungErstelltAm: konfiguration.offerteUnterschrieben
    ? konfiguration.rechnungErstelltAm ?? null
    : null,
  aktualisiertAm: konfiguration.aktualisiertAm
})

const isCountedProjectPosition = (position) =>
  Boolean(
    position?.istDrucker ||
      position?.zubehoerId ||
      String(position?.bezeichnung ?? '').trim()
  )

const serializeProjektSummary = (konfiguration) => {
  const calculation = parseSnapshot(konfiguration)
  const positions = Array.isArray(calculation.positions) ? calculation.positions : []
  const kunde = konfiguration.kunde ?? null
  const verkaeufer = kunde?.verkaeufer ?? null

  return {
    id: konfiguration.id,
    name: konfiguration.name,
    kundeId: konfiguration.kundeId,
    kunde: kunde ? serializeKunde(kunde) : null,
    verkaeufer: verkaeufer ? serializeVerkaeufer(verkaeufer) : null,
    druckermodellId: konfiguration.druckermodellId,
    druckerVarianteId: konfiguration.druckerVarianteId,
    total: amountFromDb(konfiguration.total),
    positionsCount: positions.filter(isCountedProjectPosition).length,
    calculation: {
      kundeId: konfiguration.kundeId ?? null,
      druckermodell: calculation.druckermodell ?? '',
      variante: calculation.variante ?? '',
      kundeName: calculation.kundeName ?? null,
      verkaeuferId: calculation.verkaeuferId ?? null
    },
    offerteErstelltAm: konfiguration.offerteErstelltAm ?? null,
    offerteUnterschrieben: Boolean(konfiguration.offerteUnterschrieben),
    offerteUnterschriebenAm: konfiguration.offerteUnterschriebenAm ?? null,
    offerteUnterschriebenVonId: konfiguration.offerteUnterschriebenVonId ?? null,
    rechnungErstellt: Boolean(
      konfiguration.offerteUnterschrieben && konfiguration.rechnungErstelltAm
    ),
    rechnungErstelltAm: konfiguration.offerteUnterschrieben
      ? konfiguration.rechnungErstelltAm ?? null
      : null,
    aktualisiertAm: konfiguration.aktualisiertAm
  }
}

const createProjectAmountFilters = (query) => {
  const normalized = String(query ?? '')
    .trim()
    .replace(/chf/gi, '')
    .replace(/['’\s]/g, '')
    .replace(',', '.')

  const amountMatch = /^(\d+)(?:\.(\d{0,2}))?$/.exec(normalized)

  if (!amountMatch) {
    return []
  }

  const integerPart = amountMatch[1].replace(/^0+(?=\d)/, '')
  const decimalPart = amountMatch[2]
  const francs = Number(integerPart)

  if (!Number.isSafeInteger(francs)) {
    return []
  }

  if (decimalPart !== undefined) {
    const minCents = francs * 100 + Number(decimalPart.padEnd(2, '0'))
    const maxCents = francs * 100 + Number(decimalPart.padEnd(2, '9'))

    return [{ total: { gte: minCents, lte: maxCents } }]
  }

  const maxIntegerDigits = 9
  const prefix = Number(integerPart)

  if (!Number.isSafeInteger(prefix) || integerPart.length > maxIntegerDigits) {
    return [{ total: amountToDb(prefix) }]
  }

  return Array.from(
    { length: maxIntegerDigits - integerPart.length + 1 },
    (_, index) => {
      const scale = 10 ** index

      return {
        total: {
          gte: prefix * scale * 100,
          lte: (prefix + 1) * scale * 100 - 1
        }
      }
    }
  )
}

const createProjekteWhere = (query) => {
  if (!query) {
    return {}
  }

  const amountFilters = createProjectAmountFilters(query)
  const isNumericQuery = amountFilters.length > 0
  const filters = [
    { name: { contains: query } },
    {
      kunde: {
        is: {
          firmenname: { contains: query }
        }
      }
    },
    {
      kunde: {
        is: {
          kontaktname: { contains: query }
        }
      }
    },
    {
      kunde: {
        is: {
          verkaeufer: {
            is: {
              OR: [
                { vorname: { contains: query } },
                { nachname: { contains: query } }
              ]
            }
          }
        }
      }
    }
  ]

  if (!isNumericQuery) {
    filters.push({ snapshotJson: { contains: query } })
  }

  filters.push(...amountFilters)

  return {
    OR: filters
  }
}

const projectSummaryInclude = {
  kunde: {
    include: {
      verkaeufer: true
    }
  }
}

const getKonfigurationen = async () => {
  const konfigurationen = await prisma.konfiguration.findMany({
    orderBy: [{ druckermodellId: 'asc' }, { erstelltAm: 'asc' }]
  })

  return konfigurationen.map(serializeKonfiguration)
}

const getKonfiguration = async (id) => {
  validateInteger(id, 'Konfiguration ID')

  const konfiguration = await prisma.konfiguration.findUniqueOrThrow({
    where: { id },
    include: projectSummaryInclude
  })

  return serializeKonfiguration(konfiguration)
}

const getProjekte = async (options = {}) => {
  const where = createProjekteWhere(options.query)

  if (options.paginated) {
    const [total, konfigurationen] = await prisma.$transaction([
      prisma.konfiguration.count({ where }),
      prisma.konfiguration.findMany({
        where,
        orderBy: [{ id: 'desc' }],
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
        include: projectSummaryInclude
      })
    ])

    return createPage({
      items: konfigurationen.map(serializeProjektSummary),
      total,
      page: options.page,
      pageSize: options.pageSize
    })
  }

  const konfigurationen = await prisma.konfiguration.findMany({
    where,
    orderBy: [{ druckermodellId: 'asc' }, { erstelltAm: 'asc' }],
    include: projectSummaryInclude
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
  const existing = await prisma.konfiguration.findUniqueOrThrow({
    where: { id },
    select: {
      name: true,
      kundeId: true,
      druckermodellId: true,
      druckerVarianteId: true,
      total: true,
      snapshotJson: true,
      offerteErstelltAm: true,
      offerteUnterschrieben: true
    }
  })

  if (existing.offerteUnterschrieben) {
    throw new ApiError(
      'Unterschriebene Offerten können nicht bearbeitet werden. Entferne zuerst die Markierung.',
      409
    )
  }
  
  const calculation = {
    ...validated.calculation,
    kundeId: validated.kundeId
  }
  const total = amountToDb(validated.total)
  const snapshotJson = JSON.stringify(calculation)
  const hasOfferRelevantChanges =
    existing.name !== validated.name ||
    existing.kundeId !== validated.kundeId ||
    existing.druckermodellId !== validated.druckermodellId ||
    existing.druckerVarianteId !== validated.druckerVarianteId ||
    existing.total !== total ||
    existing.snapshotJson !== snapshotJson
  
  const konfiguration = await prisma.konfiguration.update({
    where: { id },
    data: {
      name: validated.name,
      kundeId: validated.kundeId,
      druckermodellId: validated.druckermodellId,
      druckerVarianteId: validated.druckerVarianteId,
      total,
      snapshotJson,
      offerteErstelltAm:
        hasOfferRelevantChanges && existing.offerteErstelltAm
          ? new Date()
          : existing.offerteErstelltAm
    }
  })

  return serializeKonfiguration(konfiguration)
}

const ensureOfferteErstelltAm = async (id) => {
  validateInteger(id, 'Konfiguration ID')

  await prisma.konfiguration.updateMany({
    where: {
      id,
      offerteErstelltAm: null
    },
    data: {
      offerteErstelltAm: new Date()
    }
  })

  return getKonfiguration(id)
}

const setOfferteUnterschrieben = async (id, payload) => {
  validateInteger(id, 'Konfiguration ID')
  const validated = validateOfferteUnterschriebenPayload(payload)
  const benutzerId = await getDemoVerkaeuferId()

  await prisma.$transaction(async (transaction) => {
    const konfiguration = await transaction.konfiguration.findUniqueOrThrow({
      where: { id },
      include: projectSummaryInclude
    })

    if (Boolean(konfiguration.offerteUnterschrieben) === validated.unterschrieben) {
      return
    }

    if (!validated.unterschrieben) {
      await transaction.konfiguration.update({
        where: { id },
        data: {
          offerteUnterschrieben: false,
          offerteUnterschriebenAm: null,
          offerteUnterschriebenVonId: null,
          rechnungErstelltAm: null
        }
      })
      await transaction.offerteStatusAenderung.create({
        data: {
          konfigurationId: id,
          unterschrieben: false,
          benutzerId
        }
      })
      return
    }

    const latestVersion = await transaction.offerteVersion.aggregate({
      where: { konfigurationId: id },
      _max: { version: true }
    })
    const version = await transaction.offerteVersion.create({
      data: {
        konfigurationId: id,
        version: (latestVersion._max.version ?? 0) + 1,
        pdfBytes: validated.pdfBytes,
        snapshotJson: JSON.stringify(serializeKonfiguration(konfiguration)),
        erstelltVonId: benutzerId
      }
    })

    await transaction.konfiguration.update({
      where: { id },
      data: {
        offerteUnterschrieben: true,
        offerteUnterschriebenAm: new Date(),
        offerteUnterschriebenVonId: benutzerId,
        rechnungErstelltAm: null
      }
    })
    await transaction.offerteStatusAenderung.create({
      data: {
        konfigurationId: id,
        unterschrieben: true,
        offerteVersionId: version.id,
        benutzerId
      }
    })
  })

  return getKonfiguration(id)
}

const createRechnung = async (id, payload) => {
  validateInteger(id, 'Konfiguration ID')
  const validated = validateRechnungErstellenPayload(payload)
  const erstelltAm = new Date()

  await prisma.$transaction(async (transaction) => {
    const konfiguration = await transaction.konfiguration.findUniqueOrThrow({
      where: { id },
      select: {
        offerteUnterschrieben: true,
        rechnungErstelltAm: true
      }
    })

    if (!konfiguration.offerteUnterschrieben) {
      throw new ApiError('Die Rechnung kann erst nach Unterzeichnung der Offerte erstellt werden.', 409)
    }

    if (konfiguration.rechnungErstelltAm) {
      throw new ApiError('Für dieses Projekt wurde bereits eine Rechnung erstellt.', 409)
    }

    const version = await transaction.offerteVersion.findFirst({
      where: { konfigurationId: id },
      orderBy: [{ version: 'desc' }],
      select: { id: true }
    })

    if (!version) {
      throw new ApiError('Die archivierte Offerte wurde nicht gefunden.', 404)
    }

    await transaction.offerteVersion.update({
      where: { id: version.id },
      data: { rechnungPdfBytes: validated.pdfBytes }
    })
    await transaction.konfiguration.update({
      where: { id },
      data: { rechnungErstelltAm: erstelltAm }
    })
  })

  return getKonfiguration(id)
}

const deleteRechnung = async (id) => {
  validateInteger(id, 'Konfiguration ID')

  await prisma.$transaction(async (transaction) => {
    const konfiguration = await transaction.konfiguration.findUniqueOrThrow({
      where: { id },
      select: {
        offerteUnterschrieben: true,
        rechnungErstelltAm: true
      }
    })

    if (!konfiguration.offerteUnterschrieben) {
      throw new ApiError('Für dieses Projekt ist keine unterschriebene Offerte aktiv.', 409)
    }

    if (!konfiguration.rechnungErstelltAm) {
      throw new ApiError('Für dieses Projekt wurde noch keine Rechnung erstellt.', 404)
    }

    const version = await transaction.offerteVersion.findFirst({
      where: { konfigurationId: id },
      orderBy: [{ version: 'desc' }],
      select: { id: true }
    })

    if (!version) {
      throw new ApiError('Die archivierte Offerte wurde nicht gefunden.', 404)
    }

    await transaction.offerteVersion.update({
      where: { id: version.id },
      data: { rechnungPdfBytes: null }
    })
    await transaction.konfiguration.update({
      where: { id },
      data: { rechnungErstelltAm: null }
    })
  })

  return getKonfiguration(id)
}

const getArchivierteProjektPdf = async (id, type) => {
  validateInteger(id, 'Konfiguration ID')
  const konfiguration = await prisma.konfiguration.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      offerteUnterschrieben: true,
      rechnungErstelltAm: true
    }
  })

  if (!konfiguration.offerteUnterschrieben) {
    throw new ApiError('Für dieses Projekt ist keine unterschriebene Offerte aktiv', 404)
  }

  if (type === 'rechnung' && !konfiguration.rechnungErstelltAm) {
    throw new ApiError('Für dieses Projekt wurde noch keine Rechnung erstellt', 404)
  }

  const version = await prisma.offerteVersion.findFirst({
    where: { konfigurationId: id },
    orderBy: [{ version: 'desc' }],
    select: { pdfBytes: true, rechnungPdfBytes: true, version: true }
  })

  if (!version) {
    throw new ApiError('Die archivierte Offerten-PDF wurde nicht gefunden', 404)
  }

  if (type === 'rechnung' && !version.rechnungPdfBytes) {
    throw new ApiError('Die archivierte Rechnungs-PDF wurde nicht gefunden', 404)
  }

  return {
    pdfBytes: type === 'rechnung' ? version.rechnungPdfBytes : version.pdfBytes,
    version: version.version
  }
}

const deleteKonfiguration = async (id) => {
  validateInteger(id, 'Konfiguration ID')
  const konfiguration = await prisma.konfiguration.findUniqueOrThrow({
    where: { id },
    select: { offerteUnterschrieben: true }
  })

  if (konfiguration.offerteUnterschrieben) {
    throw new ApiError(
      'Projekte mit unterschriebener Offerte können nicht gelöscht werden.',
      409
    )
  }

  await prisma.konfiguration.delete({ where: { id } })
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
      const listQuery = getListQuery(url)

      sendJson(
        response,
        200,
        await getKunden({
          paginated: listQuery.enabled,
          page: listQuery.page,
          pageSize: listQuery.pageSize,
          query: listQuery.query
        })
      )
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/verkaeufer') {
      sendJson(response, 200, await getVerkaeufer())
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/projekte') {
      const listQuery = getListQuery(url)

      sendJson(
        response,
        200,
        await getProjekte({
          paginated: listQuery.enabled,
          page: listQuery.page,
          pageSize: listQuery.pageSize,
          query: listQuery.query
        })
      )
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

    const offerteDatumMatch = url.pathname.match(
      /^\/api\/konfigurationen\/(\d+)\/offerte-datum$/
    )

    if (offerteDatumMatch && request.method === 'PUT') {
      sendJson(
        response,
        200,
        await ensureOfferteErstelltAm(Number(offerteDatumMatch[1]))
      )
      return
    }

    const offerteUnterschriebenMatch = url.pathname.match(
      /^\/api\/konfigurationen\/(\d+)\/offerte-unterschrieben$/
    )

    if (offerteUnterschriebenMatch && request.method === 'PUT') {
      sendJson(
        response,
        200,
        await setOfferteUnterschrieben(
          Number(offerteUnterschriebenMatch[1]),
          await readJsonBody(request)
        )
      )
      return
    }

    const offertePdfMatch = url.pathname.match(
      /^\/api\/konfigurationen\/(\d+)\/offerte-pdf$/
    )

    if (offertePdfMatch && request.method === 'GET') {
      const version = await getArchivierteProjektPdf(Number(offertePdfMatch[1]), 'offerte')
      sendPdf(
        response,
        version.pdfBytes,
        `offerte-${offertePdfMatch[1]}-v${version.version}.pdf`
      )
      return
    }

    const rechnungErstellenMatch = url.pathname.match(
      /^\/api\/konfigurationen\/(\d+)\/rechnung$/
    )

    if (rechnungErstellenMatch && request.method === 'POST') {
      sendJson(
        response,
        201,
        await createRechnung(
          Number(rechnungErstellenMatch[1]),
          await readJsonBody(request)
        )
      )
      return
    }

    if (rechnungErstellenMatch && request.method === 'DELETE') {
      sendJson(response, 200, await deleteRechnung(Number(rechnungErstellenMatch[1])))
      return
    }

    const rechnungPdfMatch = url.pathname.match(
      /^\/api\/konfigurationen\/(\d+)\/rechnung-pdf$/
    )

    if (rechnungPdfMatch && request.method === 'GET') {
      const version = await getArchivierteProjektPdf(Number(rechnungPdfMatch[1]), 'rechnung')
      sendPdf(
        response,
        version.pdfBytes,
        `rechnung-${rechnungPdfMatch[1]}-v${version.version}.pdf`
      )
      return
    }

    const konfigurationMatch = url.pathname.match(/^\/api\/konfigurationen\/(\d+)$/)

    if (konfigurationMatch && request.method === 'GET') {
      sendJson(response, 200, await getKonfiguration(Number(konfigurationMatch[1])))
      return
    }

    if (konfigurationMatch && request.method === 'PUT') {
      sendJson(
        response,
        200,
        await updateKonfiguration(Number(konfigurationMatch[1]), await readJsonBody(request))
      )
      return
    }

    if (konfigurationMatch && request.method === 'DELETE') {
      await deleteKonfiguration(Number(konfigurationMatch[1]))
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

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} ist bereits belegt. Bitte beende den laufenden Backend-Prozess und versuche es erneut.`)
    process.exit(1)
  }

  console.error(`Server konnte nicht gestartet werden: ${error.message}`)
  process.exit(1)
})

server.listen(port, () => {
  console.log(`Kalkulation API laeuft auf http://localhost:${port}`)
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  server.close(() => process.exit(0))
})
