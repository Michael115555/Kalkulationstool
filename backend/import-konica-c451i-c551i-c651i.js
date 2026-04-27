const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const herstellerName = 'Konica Minolta'
const modellName = 'bizhub Cxx1i'

const toRappen = (betrag) => Math.round(Number(betrag) * 100)

const varianten = [
  {
    bezeichnung: 'bizhub C451i',
    geschwindigkeit: 45,
    verkaufsPreis: 8544.00,
    einkaufsPreis: 6243.96
  },
  {
    bezeichnung: 'bizhub C551i',
    geschwindigkeit: 55,
    verkaufsPreis: 10339.00,
    einkaufsPreis: 7555.74
  },
  {
    bezeichnung: 'bizhub C651i',
    geschwindigkeit: 65,
    verkaufsPreis: 11934.00,
    einkaufsPreis: 8721.37
  }
]

const zubehoer = [
  {
    kategorie: 'Kassetten + Unterschränke',
    name: 'PC-116 Universalkassette (1 x 500 Seiten; A5-A3; 80 g/m2)',
    verkaufsPreis: 675.00,
    einkaufsPreis: 493.29
  },
  {
    kategorie: 'Kassetten + Unterschränke',
    name: 'PC-216 Universalkassette (2 x 500 Seiten; A5-A3; 80 g/m2)',
    verkaufsPreis: 975.00,
    einkaufsPreis: 712.53
  },
  {
    kategorie: 'Kassetten + Unterschränke',
    name: "PC-416 Grossraumkassette (2'500 Seiten; A4, 80 g/m2)",
    verkaufsPreis: 975.00,
    einkaufsPreis: 712.53
  },
  {
    kategorie: 'Kassetten + Unterschränke',
    name: "PC-417 Grossraumkassette mit 2 parallelen Fächern (1'000 + 1'500 Seiten; A5-A4; 80 g/m2)",
    verkaufsPreis: 1315.00,
    einkaufsPreis: 961.00
  },
  {
    kategorie: 'Kassetten + Unterschränke',
    name: "LU-207 Seitliche Grossraumkassette V2 (2'500 Seiten; SRA3; 80 g/m2)",
    verkaufsPreis: 2845.00,
    einkaufsPreis: 2079.13
  },
  {
    kategorie: 'Kassetten + Unterschränke',
    name: "LU-302 Seitliche Grossraumkassette (3'000 Seiten, A4, 80 g/m2)",
    verkaufsPreis: 1730.00,
    einkaufsPreis: 1264.28
  },
  {
    kategorie: 'Kassetten + Unterschränke',
    name: 'DK-516x Unterschrank',
    verkaufsPreis: 145.00,
    einkaufsPreis: 105.97
  },
  {
    kategorie: 'Finishing',
    name: 'OT-513 Ausgabefach, Pflicht, wenn kein Finisher oder JS-508 vorhanden',
    verkaufsPreis: 155.00,
    einkaufsPreis: 113.27
  },
  {
    kategorie: 'Finishing',
    name: 'JS-508 Job-Trenneinheit, für C450i/C550i',
    verkaufsPreis: 370.00,
    einkaufsPreis: 270.40
  },
  {
    kategorie: 'Finishing',
    name: 'FS-539 Heftfinisher (50 Seiten)',
    verkaufsPreis: 1260.00,
    einkaufsPreis: 920.81
  },
  {
    kategorie: 'Finishing',
    name: 'FS-539SD Finisher mit Broschüreneinheit (Heften 50 Seiten/Booklet 20 Seiten)',
    verkaufsPreis: 2230.00,
    einkaufsPreis: 1629.68
  },
  {
    kategorie: 'Finishing',
    name: 'FS-540 Heft-Finisher (100 Seiten)',
    verkaufsPreis: 3010.00,
    einkaufsPreis: 2199.71
  },
  {
    kategorie: 'Finishing',
    name: 'FS-540SD Finisher mit Broschüreneinheit (Heften 100 Seiten/Booklet 20 Seiten)',
    verkaufsPreis: 4325.00,
    einkaufsPreis: 3160.71
  },
  {
    kategorie: 'Finishing',
    name: 'RU-513 Verbindungseinheit, für FS-539(SD) und FS-540(SD)',
    verkaufsPreis: 165.00,
    einkaufsPreis: 120.58
  },
  {
    kategorie: 'Finishing',
    name: 'PK-524 Locheinheit, für FS-539/SD',
    verkaufsPreis: 400.00,
    einkaufsPreis: 292.32
  },
  {
    kategorie: 'Finishing',
    name: 'ZU-609 Z-Falzeinheit',
    verkaufsPreis: 4865.00,
    einkaufsPreis: 3555.34
  },
  {
    kategorie: 'Finishing',
    name: 'JS-602 Job-Trenneinheit, für FS-537(SD)/FS-540(SD)',
    verkaufsPreis: 375.00,
    einkaufsPreis: 274.05
  },
  {
    kategorie: 'Finishing',
    name: 'PI-507 Zuschiesseinheit, zu FS-540SD (Nicht mit PI-507 kombinierbar)',
    verkaufsPreis: 1130.00,
    einkaufsPreis: 825.80
  },
  {
    kategorie: 'Finishing',
    name: 'PK-526 Locheinheit, für FS-540/SD',
    verkaufsPreis: 535.00,
    einkaufsPreis: 390.98
  },
  {
    kategorie: 'Finishing',
    name: 'FS-533 Integrierter Finisher V2 (50 Seiten), MK-607 für C450i/C550i Pflicht!',
    verkaufsPreis: 840.00,
    einkaufsPreis: 613.87
  },
  {
    kategorie: 'Finishing',
    name: 'MK-607 Lüftungs-Kit, für FS-533',
    verkaufsPreis: 41.00,
    einkaufsPreis: 29.96
  },
  {
    kategorie: 'Finishing',
    name: 'PK-519 Locheinheit 2/4-fach-Lochung, zu FS-533',
    verkaufsPreis: 355.00,
    einkaufsPreis: 259.43
  },
  {
    kategorie: 'Finishing',
    name: 'EH-T592 Externer Hefter (50 Seiten)',
    verkaufsPreis: 270.00,
    einkaufsPreis: 197.32
  },
  {
    kategorie: 'Fax',
    name: 'FK-514 Fax Karte v2',
    verkaufsPreis: 1025.00,
    einkaufsPreis: 749.07
  }
]

async function findOrCreateHersteller() {
  return prisma.hersteller.upsert({
    where: {
      name: herstellerName
    },
    update: {},
    create: {
      name: herstellerName
    }
  })
}

async function findOrCreateDruckermodell(herstellerId) {
  return prisma.druckermodell.upsert({
    where: {
      herstellerId_name: {
        herstellerId,
        name: modellName
      }
    },
    update: {},
    create: {
      herstellerId,
      name: modellName
    }
  })
}

async function importVarianten(druckermodellId) {
  for (const variante of varianten) {
    await prisma.druckerVariante.upsert({
      where: {
        druckermodellId_bezeichnung: {
          druckermodellId,
          bezeichnung: variante.bezeichnung
        }
      },
      update: {
        geschwindigkeit: variante.geschwindigkeit,
        verkaufsPreis: toRappen(variante.verkaufsPreis),
        einkaufsPreis: toRappen(variante.einkaufsPreis)
      },
      create: {
        druckermodellId,
        bezeichnung: variante.bezeichnung,
        geschwindigkeit: variante.geschwindigkeit,
        verkaufsPreis: toRappen(variante.verkaufsPreis),
        einkaufsPreis: toRappen(variante.einkaufsPreis)
      }
    })
  }
}

async function findOrCreateKategorie(name) {
  return prisma.zubehoerKategorie.upsert({
    where: {
      name
    },
    update: {},
    create: {
      name
    }
  })
}

async function findOrCreateZubehoer(item, kategorieId) {
  return prisma.zubehoer.upsert({
    where: {
      kategorieId_name: {
        kategorieId,
        name: item.name
      }
    },
    update: {
      verkaufsPreis: toRappen(item.verkaufsPreis),
      einkaufsPreis: toRappen(item.einkaufsPreis)
    },
    create: {
      kategorieId,
      name: item.name,
      verkaufsPreis: toRappen(item.verkaufsPreis),
      einkaufsPreis: toRappen(item.einkaufsPreis)
    }
  })
}

async function connectZubehoerToDruckermodell(druckermodellId, zubehoerId) {
  await prisma.druckermodellZubehoer.upsert({
    where: {
      druckermodellId_zubehoerId: {
        druckermodellId,
        zubehoerId
      }
    },
    update: {},
    create: {
      druckermodellId,
      zubehoerId
    }
  })
}

async function importZubehoer(druckermodellId) {
  for (const item of zubehoer) {
    const kategorie = await findOrCreateKategorie(item.kategorie)
    const zubehoerEintrag = await findOrCreateZubehoer(item, kategorie.id)

    await connectZubehoerToDruckermodell(druckermodellId, zubehoerEintrag.id)
  }
}

async function main() {
  const hersteller = await findOrCreateHersteller()
  const druckermodell = await findOrCreateDruckermodell(hersteller.id)

  await importVarianten(druckermodell.id)
  await importZubehoer(druckermodell.id)

  console.log('Import abgeschlossen:')
  console.log(`Hersteller: ${herstellerName}`)
  console.log(`Druckermodell: ${modellName}`)
  console.log(`Varianten: ${varianten.length}`)
  console.log(`Zubehör: ${zubehoer.length}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })