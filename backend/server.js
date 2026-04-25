const http = require('node:http')
const { URL } = require('node:url')
const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()
const port = Number(process.env.PORT || 3001)

const amountFromDb = (value) => Number(value ?? 0) / 100
const amountToDb = (value) => Math.round(Number(value ?? 0) * 100)
const optionalString = (value) => {
  const text = String(value ?? '').trim()

  return text || null
}

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

    request.on('data', (chunk) => {
      body += chunk
    })
    request.on('end', () => {
      if (!body.trim()) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(body))
      } catch (error) {
        reject(error)
      }
    })
    request.on('error', reject)
  })

const getKatalog = async () => {
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

  return {
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
  const firmenname = optionalString(payload.firmenname)

  if (!firmenname) {
    throw new Error('Kundenname darf nicht leer sein')
  }

  const verkaeuferId = payload.verkaeuferId ? Number(payload.verkaeuferId) : null

  const kunde = await prisma.kunde.create({
    data: {
      firmenname,
      kontaktname: optionalString(payload.kontaktname),
      email: optionalString(payload.email),
      telefon: optionalString(payload.telefon),
      ort: optionalString(payload.ort),
      kontaktart: optionalString(payload.kontaktart),
      versandart: optionalString(payload.versandart),
      verkaeuferId
    },
    include: {
      verkaeufer: true
    }
  })

  return serializeKunde(kunde)
}

const updateKunde = async (id, payload) => {
  const firmenname = optionalString(payload.firmenname)

  if (!firmenname) {
    throw new Error('Kundenname darf nicht leer sein')
  }

  const verkaeuferId = payload.verkaeuferId ? Number(payload.verkaeuferId) : null

  const kunde = await prisma.kunde.update({
    where: { id },
    data: {
      firmenname,
      kontaktname: optionalString(payload.kontaktname),
      email: optionalString(payload.email),
      telefon: optionalString(payload.telefon),
      ort: optionalString(payload.ort),
      kontaktart: optionalString(payload.kontaktart),
      versandart: optionalString(payload.versandart),
      verkaeuferId
    },
    include: {
      verkaeufer: true
    }
  })

  return serializeKunde(kunde)
}

const deleteKunde = async (id) => {
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

const serializeKonfiguration = (konfiguration) => ({
  id: konfiguration.id,
  name: konfiguration.name,
  kundeId: konfiguration.kundeId,
  druckermodellId: konfiguration.druckermodellId,
  druckerVarianteId: konfiguration.druckerVarianteId,
  total: amountFromDb(konfiguration.total),
  calculation: {
    ...JSON.parse(konfiguration.snapshotJson),
    kundeId: konfiguration.kundeId ?? null
  },
  aktualisiertAm: konfiguration.aktualisiertAm
})

const getKonfigurationen = async () => {
  const konfigurationen = await prisma.konfiguration.findMany({
    orderBy: [{ druckermodellId: 'asc' }, { erstelltAm: 'asc' }]
  })

  return konfigurationen.map(serializeKonfiguration)
}

const createKonfiguration = async (payload) => {
  const kundeId = payload.kundeId ? Number(payload.kundeId) : null
  const calculation = {
    ...payload.calculation,
    kundeId
  }
  const konfiguration = await prisma.konfiguration.create({
    data: {
      name: payload.name,
      kundeId,
      druckermodellId: Number(payload.druckermodellId),
      druckerVarianteId: payload.druckerVarianteId ? Number(payload.druckerVarianteId) : null,
      total: amountToDb(payload.total),
      snapshotJson: JSON.stringify(calculation)
    }
  })

  return serializeKonfiguration(konfiguration)
}

const updateKonfiguration = async (id, payload) => {
  const kundeId = payload.kundeId ? Number(payload.kundeId) : null
  const calculation = {
    ...payload.calculation,
    kundeId
  }
  const konfiguration = await prisma.konfiguration.update({
    where: { id },
    data: {
      name: payload.name,
      kundeId,
      druckermodellId: Number(payload.druckermodellId),
      druckerVarianteId: payload.druckerVarianteId ? Number(payload.druckerVarianteId) : null,
      total: amountToDb(payload.total),
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
    console.error(error)
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
