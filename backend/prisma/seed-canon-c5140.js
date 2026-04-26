const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function chfToRappen(value) {
  return Math.round(value * 100)
}

async function main() {
  const hersteller = await prisma.hersteller.upsert({
    where: { name: 'Canon' },
    update: {},
    create: { name: 'Canon' }
  })

  const epFaktorGruppe = await prisma.epFaktorGruppe.upsert({
    where: { name: 'Canon' },
    update: {},
    create: { name: 'Canon' }
  })

  const druckermodell = await prisma.druckermodell.upsert({
    where: {
      herstellerId_name: {
        herstellerId: hersteller.id,
        name: 'Canon imageForce C5140 inkl. SpeedLizenz 40er'
      }
    },
    update: {
      epFaktorGruppeId: epFaktorGruppe.id
    },
    create: {
      name: 'Canon imageForce C5140 inkl. SpeedLizenz 40er',
      herstellerId: hersteller.id,
      epFaktorGruppeId: epFaktorGruppe.id
    }
  })

  await prisma.druckerVariante.upsert({
    where: {
      druckermodellId_bezeichnung: {
        druckermodellId: druckermodell.id,
        bezeichnung: 'Standard'
      }
    },
    update: {
      geschwindigkeit: 40,
      verkaufsPreis: chfToRappen(17233.85),
      einkaufsPreis: chfToRappen(5487.79)
    },
    create: {
      druckermodellId: druckermodell.id,
      bezeichnung: 'Standard',
      geschwindigkeit: 40,
      verkaufsPreis: chfToRappen(17233.85),
      einkaufsPreis: chfToRappen(5487.79)
    }
  })

  const items = [
    {
      category: 'Kassetten & Unterschränke',
      name: "Kassetteneinheit F1 mit hoher Kapazität - 2'450 Blatt",
      vp: 2924.00,
      ep: 964.92
    },
    {
      category: 'Kassetten & Unterschränke',
      name: "Kassetteneinheit AY1 - 2x550 Blatt",
      vp: 1685.00,
      ep: 556.05
    },
    {
      category: 'Kassetten & Unterschränke',
      name: 'Unterschrank Q3',
      vp: 564.00,
      ep: 186.12
    },
    {
      category: 'Kassetten & Unterschränke',
      name: "Papiermagazineinheit F2 seitlich - 2'700 Blatt",
      vp: 2811.00,
      ep: 927.63
    },
    {
      category: 'Fax',
      name: 'Super G3 FAX Board-AX2',
      vp: 1336.00,
      ep: 440.88
    },
    {
      category: 'Fax',
      name: 'Wireless LAN Board-H1',
      vp: 239.00,
      ep: 96.69
    },
    {
      category: 'Fax',
      name: 'Wireless LAN 5GHz License-A1@E',
      vp: 119.00,
      ep: 83.30
    },
    {
      category: 'Druckausgabe',
      name: 'Interner Finisher N1',
      vp: 2134.00,
      ep: 704.22
    },
    {
      category: 'Druckausgabe',
      name: 'Locheinheit D1 (2er/4er Lochung) - für Interner Finisher only',
      vp: 780.00,
      ep: 257.40
    },
    {
      category: 'Druckausgabe',
      name: '1st Copy Tray Kit-B1  !Pflicht wenn kein Finisher gewählt wird! NICHT VERGESSEN',
      vp: 74.00,
      ep: 24.42
    },
    {
      category: 'Druckausgabe',
      name: '3rd Copy Tray Kit-A1',
      vp: 108.00,
      ep: 35.64
    },
    {
      category: 'Druckausgabe',
      name: 'Tab Feeding Attachmend F1 - Karteikartenzufuhr',
      vp: 557.00,
      ep: 217.23
    },
    {
      category: 'Druckausgabe',
      name: 'Long Sheet Feeding Tray A1 - Unterstützung des Bannerdrucks',
      vp: 966.00,
      ep: 318.78
    },
    {
      category: 'Druckausgabe',
      name: 'Utility Tray B1 - Interner Ausgabeschacht',
      vp: 120.00,
      ep: 39.60
    },
    {
      category: 'Druckausgabe',
      name: 'Locheinheit A1 (2er/4er Lochung)',
      vp: 907.00,
      ep: 299.31
    },
    {
      category: 'Druckausgabe',
      name: 'Internes 2 Wege Fach M1',
      vp: 124.00,
      ep: 40.92
    },
    {
      category: 'Druckausgabe',
      name: 'Buffer Pass Einheit R2',
      vp: 508.00,
      ep: 167.64
    },
    {
      category: 'Druckausgabe',
      name: 'Papierfalteinheit L1 (in Verbindung mit einem Finisher)',
      vp: 7830.00,
      ep: 2583.90
    },
    {
      category: 'Druckausgabe',
      name: 'Broschürenfinisher/C-Folding Unit A2',
      vp: 5926.00,
      ep: 1955.58
    },
    {
      category: 'Druckausgabe',
      name: 'Externer Heftfinisher AB3',
      vp: 3037.00,
      ep: 1002.21
    },
    {
      category: 'Externe Kontrolle und Optionen',
      name: 'imagePASS-T1',
      vp: 13786.00,
      ep: 4549.38
    }
  ]

  for (const item of items) {
    const kategorie = await prisma.zubehoerKategorie.upsert({
      where: { name: item.category },
      update: {},
      create: { name: item.category }
    })

    const zubehoer = await prisma.zubehoer.upsert({
      where: {
        kategorieId_name: {
          kategorieId: kategorie.id,
          name: item.name
        }
      },
      update: {
        verkaufsPreis: chfToRappen(item.vp),
        einkaufsPreis: chfToRappen(item.ep)
      },
      create: {
        name: item.name,
        verkaufsPreis: chfToRappen(item.vp),
        einkaufsPreis: chfToRappen(item.ep),
        kategorieId: kategorie.id
      }
    })

    await prisma.druckermodellZubehoer.upsert({
      where: {
        druckermodellId_zubehoerId: {
          druckermodellId: druckermodell.id,
          zubehoerId: zubehoer.id
        }
      },
      update: {},
      create: {
        druckermodellId: druckermodell.id,
        zubehoerId: zubehoer.id
      }
    })
  }

  console.log('Canon imageForce C5140 wurde erfolgreich importiert.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })