import { createOfferteDocumentData } from './offerteDocument'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN_LEFT = 42
const MARGIN_RIGHT = 42
const TOP_Y = 788
const BOTTOM_Y = 54
const DEFAULT_LINE_HEIGHT = 16
const DEFAULT_FONT_SIZE = 12
const HEADING_FONT_SIZE = 16
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
const CONTENT_RIGHT = PAGE_WIDTH - MARGIN_RIGHT

const COLORS = {
  accent: [0.05, 0.43, 0.99],
  accentDark: [0.05, 0.43, 0.99],
  accentSoft: [0.91, 0.96, 1],
  accentBorder: [0.62, 0.8, 1],
  ink: [0.12, 0.16, 0.22],
  muted: [0.33, 0.37, 0.43],
  softText: [0.43, 0.47, 0.52],
  border: [0.82, 0.84, 0.87],
  softBorder: [0.9, 0.91, 0.93],
  softBg: [0.97, 0.98, 0.98],
  tableHeader: [0.965, 0.972, 0.982],
  tableStripe: [0.985, 0.988, 0.992],
  white: [1, 1, 1]
}

const DEFAULT_SENDER_LINES = [
  'Demofirma AG',
  'Musterstrasse 1',
  '8000 Zürich'
]

const winAnsiMap = new Map([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f]
])

const isFilled = (value) => String(value ?? '').trim().length > 0

const sanitizeText = (value) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()

const colorOperator = (color, operator) =>
  `${color.map((value) => Number(value).toFixed(3)).join(' ')} ${operator}`

const formatTableAmount = (value) => {
  const text = sanitizeText(value)

  if (!text) {
    return ''
  }

  return text
    .replace(/^-\s*CHF\s+/i, '- ')
    .replace(/^CHF\s+/i, '')
}

const encodeWinAnsiHex = (value) => {
  const bytes = []

  for (const character of String(value ?? '')) {
    const codePoint = character.codePointAt(0)

    if (codePoint <= 0x7f || (codePoint >= 0xa0 && codePoint <= 0xff)) {
      bytes.push(codePoint)
    } else if (winAnsiMap.has(codePoint)) {
      bytes.push(winAnsiMap.get(codePoint))
    } else {
      bytes.push(0x3f)
    }
  }

  return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

const helveticaWidths = {
  regular: {
    ' ': 278,
    '!': 278,
    '"': 355,
    '#': 556,
    '$': 556,
    '%': 889,
    '&': 667,
    "'": 191,
    '(': 333,
    ')': 333,
    '*': 389,
    '+': 584,
    ',': 278,
    '-': 333,
    '.': 278,
    '/': 278,
    '0': 556,
    '1': 556,
    '2': 556,
    '3': 556,
    '4': 556,
    '5': 556,
    '6': 556,
    '7': 556,
    '8': 556,
    '9': 556,
    ':': 278,
    ';': 278,
    '<': 584,
    '=': 584,
    '>': 584,
    '?': 556,
    '@': 1015,
    A: 667,
    B: 667,
    C: 722,
    D: 722,
    E: 667,
    F: 611,
    G: 778,
    H: 722,
    I: 278,
    J: 500,
    K: 667,
    L: 556,
    M: 833,
    N: 722,
    O: 778,
    P: 667,
    Q: 778,
    R: 722,
    S: 667,
    T: 611,
    U: 722,
    V: 667,
    W: 944,
    X: 667,
    Y: 667,
    Z: 611,
    '[': 278,
    '\\': 278,
    ']': 278,
    '^': 469,
    _: 556,
    '`': 222,
    a: 556,
    b: 556,
    c: 500,
    d: 556,
    e: 556,
    f: 278,
    g: 556,
    h: 556,
    i: 222,
    j: 222,
    k: 500,
    l: 222,
    m: 833,
    n: 556,
    o: 556,
    p: 556,
    q: 556,
    r: 333,
    s: 500,
    t: 278,
    u: 556,
    v: 500,
    w: 722,
    x: 500,
    y: 500,
    z: 500,
    '{': 334,
    '|': 260,
    '}': 334,
    '~': 584
  },
  bold: {
    ' ': 278,
    '!': 333,
    '"': 474,
    '#': 556,
    '$': 556,
    '%': 889,
    '&': 722,
    "'": 238,
    '(': 333,
    ')': 333,
    '*': 389,
    '+': 584,
    ',': 278,
    '-': 333,
    '.': 278,
    '/': 278,
    '0': 556,
    '1': 556,
    '2': 556,
    '3': 556,
    '4': 556,
    '5': 556,
    '6': 556,
    '7': 556,
    '8': 556,
    '9': 556,
    ':': 333,
    ';': 333,
    '<': 584,
    '=': 584,
    '>': 584,
    '?': 611,
    '@': 975,
    A: 722,
    B: 722,
    C: 722,
    D: 722,
    E: 667,
    F: 611,
    G: 778,
    H: 722,
    I: 278,
    J: 556,
    K: 722,
    L: 611,
    M: 833,
    N: 722,
    O: 778,
    P: 667,
    Q: 778,
    R: 722,
    S: 667,
    T: 611,
    U: 722,
    V: 667,
    W: 944,
    X: 667,
    Y: 667,
    Z: 611,
    '[': 333,
    '\\': 278,
    ']': 333,
    '^': 584,
    _: 556,
    '`': 278,
    a: 556,
    b: 611,
    c: 556,
    d: 611,
    e: 556,
    f: 333,
    g: 611,
    h: 611,
    i: 278,
    j: 278,
    k: 556,
    l: 278,
    m: 889,
    n: 611,
    o: 611,
    p: 611,
    q: 611,
    r: 389,
    s: 556,
    t: 333,
    u: 611,
    v: 556,
    w: 778,
    x: 556,
    y: 556,
    z: 500,
    '{': 389,
    '|': 280,
    '}': 389,
    '~': 584
  }
}

const helveticaAliases = {
  'Ä': 'A',
  'Ö': 'O',
  'Ü': 'U',
  'ä': 'a',
  'à': 'a',
  'ö': 'o',
  'ü': 'u',
  'é': 'e',
  'è': 'e',
  '’': "'"
}

const estimateTextWidth = (value, fontSize, isBold = false) => {
  const text = String(value ?? '')
  const widths = isBold ? helveticaWidths.bold : helveticaWidths.regular

  return Array.from(text).reduce((width, character) => {
    const normalizedCharacter = helveticaAliases[character] ?? character
    const characterWidth = widths[normalizedCharacter] ?? 556

    return width + (characterWidth / 1000) * fontSize
  }, 0)
}

const wrapText = (value, maxWidth, fontSize = DEFAULT_FONT_SIZE, isBold = false) => {
  const words = sanitizeText(value).split(' ').filter(Boolean)
  const lines = []
  let currentLine = ''

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word

    if (
      currentLine &&
      estimateTextWidth(nextLine, fontSize, isBold) > maxWidth
    ) {
      lines.push(currentLine)
      currentLine = word
      return
    }

    currentLine = nextLine
  })

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.length > 0 ? lines : ['']
}

const formatOfferDate = (generatedAt) =>
  new Intl.DateTimeFormat('de-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(generatedAt))

const formatOfferNumber = (projectId, generatedAt) => {
  const year = new Date(generatedAt).getFullYear()
  const suffix = isFilled(projectId) ? String(projectId).padStart(2, '0') : '00'

  return `${year}-${suffix}`
}

const sanitizeFilenamePart = (value) =>
  sanitizeText(value)
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 80)

class PdfLayout {
  constructor() {
    this.pages = []
    this.currentPage = null
    this.y = TOP_Y
    this.addPage()
  }

  addPage() {
    this.currentPage = []
    this.pages.push(this.currentPage)
    this.y = TOP_Y
  }

  ensureSpace(height) {
    if (this.y - height < BOTTOM_Y) {
      this.addPage()
    }
  }

  addRaw(operation) {
    this.currentPage.push(operation)
  }

  drawText(text, x, y, options = {}) {
    const size = options.size ?? DEFAULT_FONT_SIZE
    const font = options.bold ? 'F2' : 'F1'
    const color = options.color ?? [0, 0, 0]

    this.addRaw(
      `${colorOperator(color, 'rg')} BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td <${encodeWinAnsiHex(text)}> Tj ET`
    )
  }

  drawRightText(text, rightX, y, options = {}) {
    const size = options.size ?? DEFAULT_FONT_SIZE
    const x = rightX - estimateTextWidth(text, size, Boolean(options.bold))

    this.drawText(text, x, y, options)
  }

  drawLine(x1, y1, x2, y2, width = 0.7, color = [0, 0, 0]) {
    this.addRaw(`q ${colorOperator(color, 'RG')} ${width.toFixed(2)} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S Q`)
  }

  drawRect(x, y, width, height, options = {}) {
    if (options.fillColor) {
      this.addRaw(`q ${colorOperator(options.fillColor, 'rg')} ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f Q`)
    }

    if (options.strokeColor) {
      const lineWidth = options.lineWidth ?? 0.7

      this.addRaw(`q ${colorOperator(options.strokeColor, 'RG')} ${lineWidth.toFixed(2)} w ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S Q`)
    }
  }

  addTextLines(lines, options = {}) {
    const x = options.x ?? MARGIN_LEFT
    const size = options.size ?? DEFAULT_FONT_SIZE
    const lineHeight = options.lineHeight ?? DEFAULT_LINE_HEIGHT
    const bold = Boolean(options.bold)
    const color = options.color ?? COLORS.ink

    this.ensureSpace(lines.length * lineHeight)

    lines.forEach((line) => {
      this.drawText(line, x, this.y, { size, bold, color })
      this.y -= lineHeight
    })
  }

  addParagraph(text, options = {}) {
    const x = options.x ?? MARGIN_LEFT
    const width = options.width ?? CONTENT_WIDTH
    const size = options.size ?? DEFAULT_FONT_SIZE
    const lineHeight = options.lineHeight ?? DEFAULT_LINE_HEIGHT
    const bold = Boolean(options.bold)
    const after = options.after ?? 12
    const color = options.color ?? COLORS.ink
    const lines = wrapText(text, width, size, bold)

    this.ensureSpace(lines.length * lineHeight + after)
    lines.forEach((line) => {
      this.drawText(line, x, this.y, { size, bold, color })
      this.y -= lineHeight
    })
    this.y -= after
  }

  addHeading(text, options = {}) {
    const size = options.size ?? HEADING_FONT_SIZE
    const before = options.before ?? 0
    const after = options.after ?? 18
    const color = options.color ?? COLORS.ink

    this.ensureSpace(before + size + after)
    this.y -= before
    this.drawText(text, MARGIN_LEFT, this.y, { size, bold: true, color })
    this.y -= after
  }

  addSubheading(text, options = {}) {
    const before = options.before ?? 0
    const after = options.after ?? 14
    const size = options.size ?? 12

    this.ensureSpace(before + 24 + after)
    this.y -= before
    this.drawRect(MARGIN_LEFT, this.y - 2, 24, 2, {
      fillColor: COLORS.accent
    })
    this.drawText(text, MARGIN_LEFT + 34, this.y - 6, {
      size,
      bold: true,
      color: COLORS.ink
    })
    this.y -= after
  }

  addBullet(text, options = {}) {
    const x = options.x ?? MARGIN_LEFT
    const textX = x + 10
    const width = options.width ?? PAGE_WIDTH - textX - MARGIN_RIGHT
    const size = options.size ?? DEFAULT_FONT_SIZE
    const lineHeight = options.lineHeight ?? 14
    const lines = wrapText(text, width, size)

    this.ensureSpace(lines.length * lineHeight)
    this.drawText('•', x, this.y, { size })
    lines.forEach((line, index) => {
      this.drawText(line, textX, this.y - index * lineHeight, { size })
    })
    this.y -= lines.length * lineHeight
  }

  addSpacer(height) {
    this.y -= height
  }
}

const createPdfBytes = (pages) => {
  const objects = []
  const addObject = (content) => {
    objects.push(content)
    return objects.length
  }

  const catalogObjectId = addObject('<< /Type /Catalog /Pages 2 0 R >>')
  const pagesObjectId = addObject('')
  const regularFontObjectId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  const boldFontObjectId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
  const pageObjectIds = []

  pages.forEach((operations) => {
    const content = operations.join('\n')
    const contentObjectId = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
    const pageObjectId = addObject(
      [
        '<< /Type /Page',
        `   /Parent ${pagesObjectId} 0 R`,
        `   /MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(2)}]`,
        `   /Resources << /Font << /F1 ${regularFontObjectId} 0 R /F2 ${boldFontObjectId} 0 R >> >>`,
        `   /Contents ${contentObjectId} 0 R`,
        '>>'
      ].join('\n')
    )

    pageObjectIds.push(pageObjectId)
  })

  objects[pagesObjectId - 1] =
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`

  if (catalogObjectId !== 1) {
    throw new Error('Unerwartete PDF Objektstruktur')
  }

  let output = '%PDF-1.4\n'
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(output.length)
    output += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = output.length

  output += `xref\n0 ${objects.length + 1}\n`
  output += '0000000000 65535 f \n'
  offsets.slice(1).forEach((offset) => {
    output += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new TextEncoder().encode(output)
}

const getRecipientLines = (data) => [
  data.customer.name,
  data.customer.contact,
  data.customer.address,
  data.customer.location
].filter(isFilled)

const getTotalAmount = (data) => {
  const totalRow = data.priceRows.find((row) => row.isTotal)
  const amount = formatTableAmount(totalRow?.value ?? '')

  return amount ? formatTotalAmount(amount) : ''
}

const addDocumentHeader = (layout, senderLines, data, generatedAt) => {
  const offerNumber = formatOfferNumber(data.projektId, generatedAt)
  const senderName = senderLines[0] ?? ''
  const senderDetails = senderLines.slice(1)

  layout.drawRect(MARGIN_LEFT, TOP_Y - 48, 4, 50, {
    fillColor: COLORS.accent
  })
  layout.drawText(senderName, MARGIN_LEFT + 14, TOP_Y, {
    size: 15,
    bold: true,
    color: COLORS.ink
  })

  senderDetails.forEach((line, index) => {
    layout.drawText(line, MARGIN_LEFT + 14, TOP_Y - 17 - index * 13, {
      size: 9.5,
      color: COLORS.muted
    })
  })

  layout.drawRightText('Offerte', CONTENT_RIGHT, TOP_Y, {
    size: 20,
    bold: true,
    color: COLORS.ink
  })
  layout.drawRightText(`Nr. ${offerNumber}`, CONTENT_RIGHT, TOP_Y - 23, {
    size: 10,
    color: COLORS.muted
  })
  layout.drawRightText(formatOfferDate(generatedAt), CONTENT_RIGHT, TOP_Y - 38, {
    size: 10,
    color: COLORS.muted
  })
  layout.drawLine(MARGIN_LEFT, TOP_Y - 62, CONTENT_RIGHT, TOP_Y - 62, 0.65, COLORS.border)
  layout.y = TOP_Y - 88

  return offerNumber
}

const addRecipientAndSummary = (layout, data) => {
  const recipientLines = getRecipientLines(data)
  const displayedRecipientLines = recipientLines.length > 0
    ? recipientLines
    : ['Kunde noch nicht erfasst']
  const topY = layout.y
  const summaryWidth = 190
  const summaryX = CONTENT_RIGHT - summaryWidth
  const summaryHeight = 86
  const totalAmount = getTotalAmount(data) || 'CHF -'

  layout.drawText('Empfänger', MARGIN_LEFT, topY, {
    size: 9,
    bold: true,
    color: COLORS.accent
  })

  displayedRecipientLines.forEach((line, index) => {
    layout.drawText(line, MARGIN_LEFT, topY - 18 - index * 15, {
      size: index === 0 ? 12 : 11,
      bold: index === 0,
      color: COLORS.ink
    })
  })

  layout.drawRect(summaryX, topY - summaryHeight, summaryWidth, summaryHeight, {
    fillColor: COLORS.accentSoft,
    strokeColor: COLORS.accentBorder,
    lineWidth: 0.55
  })
  layout.drawText('Nettopreis', summaryX + 14, topY - 22, {
    size: 9.5,
    bold: true,
    color: COLORS.muted
  })
  layout.drawRightText(totalAmount, summaryX + summaryWidth - 14, topY - 47, {
    size: 16,
    bold: true,
    color: COLORS.accentDark
  })
  layout.drawText('inkl. MwSt.', summaryX + 14, topY - 67, {
    size: 9.5,
    color: COLORS.softText
  })
  layout.drawRightText('30 Tage gültig', summaryX + summaryWidth - 14, topY - 67, {
    size: 9.5,
    color: COLORS.softText
  })

  layout.y = topY - Math.max(summaryHeight + 20, 22 + displayedRecipientLines.length * 15)
}

const offerTableColumns = [
  { key: 'pos', label: 'Pos', width: 44, align: 'right' },
  { key: 'description', label: 'Beschreibung', width: CONTENT_WIDTH - 44 - 122, align: 'left' },
  { key: 'amount', label: 'Betrag', width: 122, align: 'right' }
]

const drawOfferTableHeader = (layout) => {
  const headerHeight = 26
  let x = MARGIN_LEFT

  layout.ensureSpace(headerHeight + 32)
  layout.drawRect(MARGIN_LEFT, layout.y - headerHeight, CONTENT_WIDTH, headerHeight, {
    fillColor: COLORS.tableHeader
  })
  layout.drawRect(MARGIN_LEFT, layout.y - 2, CONTENT_WIDTH, 2, {
    fillColor: COLORS.accent
  })

  offerTableColumns.forEach((column) => {
    const textY = layout.y - 17
    const textX = x + 8

    if (column.align === 'right') {
      layout.drawRightText(column.label, x + column.width - 8, textY, {
        size: 10,
        bold: true,
        color: COLORS.ink
      })
    } else {
      layout.drawText(column.label, textX, textY, {
        size: 10,
        bold: true,
        color: COLORS.ink
      })
    }

    x += column.width
  })

  layout.y -= headerHeight
}

const getPositionDescription = (row) =>
  [row.bezeichnung, row.kategorie].filter(isFilled).join(' - ')

const getOfferTableRows = (data) => {
  const positionRows = data.positionRows.map((row, index) => ({
    pos: String(index + 1),
    description: getPositionDescription(row),
    amount: formatTableAmount(row.total),
    type: 'position'
  }))

  const adjustmentRows = data.priceRows
    .filter((row) => !row.isTotal)
    .filter((row) => positionRows.length === 0 || row.label !== 'Geräte- und Zubehörpaket')
    .map((row) => ({
      pos: '',
      description: row.label,
      amount: formatTableAmount(row.value),
      type: 'adjustment'
    }))

  const totalRow = data.priceRows.find((row) => row.isTotal)

  return [
    ...positionRows,
    ...adjustmentRows,
    {
      pos: '',
      description: 'Total',
      amount: formatTableAmount(totalRow?.value ?? ''),
      type: 'total'
    }
  ].filter((row) => isFilled(row.description) || isFilled(row.amount))
}

const formatTotalAmount = (amount) => {
  const text = sanitizeText(amount)

  if (!text) {
    return ''
  }

  return /^CHF\s/i.test(text) ? text : `CHF ${text}`
}

const formatPanelAmount = (amount) => {
  const text = sanitizeText(formatTableAmount(amount))

  if (!text) {
    return ''
  }

  if (text.startsWith('-')) {
    return `- CHF ${text.replace(/^-\s*/, '')}`
  }

  return /^CHF\s/i.test(text) ? text : `CHF ${text}`
}

const drawContinuationHeader = (layout, options = {}) => {
  const offerNumber = options.offerNumber ?? ''

  layout.drawText(options.title ?? 'Offerte - Fortsetzung', MARGIN_LEFT, TOP_Y, {
    size: 13,
    bold: true,
    color: COLORS.ink
  })

  if (isFilled(offerNumber)) {
    layout.drawRightText(`Nr. ${offerNumber}`, CONTENT_RIGHT, TOP_Y, {
      size: 10,
      color: COLORS.muted
    })
  }

  layout.drawLine(MARGIN_LEFT, TOP_Y - 20, CONTENT_RIGHT, TOP_Y - 20, 0.7, COLORS.border)
  layout.y = TOP_Y - 42
}

const addOfferTable = (layout, rows, options = {}) => {
  drawOfferTableHeader(layout)

  if (rows.length === 0) {
    const rowHeight = 30

    layout.drawRect(MARGIN_LEFT, layout.y - rowHeight, CONTENT_WIDTH, rowHeight, {
      fillColor: COLORS.softBg,
      strokeColor: COLORS.softBorder,
      lineWidth: 0.5
    })
    layout.drawText('Keine Positionen gespeichert.', MARGIN_LEFT + 8, layout.y - 20, {
      size: 11,
      color: COLORS.muted
    })
    layout.y -= rowHeight
    return
  }

  rows.forEach((row, index) => {
    const isTotal = row.type === 'total'
    const isAdjustment = row.type === 'adjustment'
    const rowLineHeight = 13
    const descriptionSize = isTotal ? 11.5 : 10.3
    const descriptionLines = wrapText(
      row.description,
      offerTableColumns[1].width - 14,
      descriptionSize,
      isTotal
    )
    const rowHeight = isTotal
      ? 34
      : Math.max(isAdjustment ? 25 : 28, 11 + descriptionLines.length * rowLineHeight)

    if (layout.y - rowHeight < BOTTOM_Y) {
      layout.addPage()
      drawContinuationHeader(layout, options)
      drawOfferTableHeader(layout)
    }

    const bottomY = layout.y - rowHeight
    const fillColor = isTotal
      ? COLORS.accent
      : index % 2 === 0
        ? COLORS.tableStripe
        : undefined
    const textY = layout.y - (isTotal ? 21 : 18)
    const posRightX = MARGIN_LEFT + offerTableColumns[0].width - 8
    const descriptionX = MARGIN_LEFT + offerTableColumns[0].width + 12
    const amountRightX = CONTENT_RIGHT - 8

    if (fillColor) {
      layout.drawRect(MARGIN_LEFT, bottomY, CONTENT_WIDTH, rowHeight, {
        fillColor
      })
    }

    if (!isTotal) {
      layout.drawLine(MARGIN_LEFT, bottomY, CONTENT_RIGHT, bottomY, 0.45, COLORS.softBorder)
    }

    if (isFilled(row.pos)) {
      layout.drawRightText(row.pos, posRightX, textY, {
        size: 10.5,
        color: COLORS.softText
      })
    }

    descriptionLines.forEach((line, lineIndex) => {
      layout.drawText(line, descriptionX, textY - lineIndex * rowLineHeight, {
        size: descriptionSize,
        bold: isTotal,
        color: isTotal ? COLORS.white : isAdjustment ? COLORS.muted : COLORS.ink
      })
    })

    layout.drawRightText(isTotal ? formatTotalAmount(row.amount) : row.amount, amountRightX, textY, {
      size: isTotal ? 12.5 : 10.5,
      bold: true,
      color: isTotal ? COLORS.white : COLORS.ink
    })

    layout.y -= rowHeight
  })
}

const addSimpleLines = (layout, lines, options = {}) => {
  const size = options.size ?? DEFAULT_FONT_SIZE
  const lineHeight = options.lineHeight ?? DEFAULT_LINE_HEIGHT
  const color = options.color ?? COLORS.ink

  lines.filter(isFilled).forEach((line) => {
    const wrappedLines = wrapText(line, CONTENT_WIDTH, size)

    layout.ensureSpace(wrappedLines.length * lineHeight)
    wrappedLines.forEach((wrappedLine) => {
      layout.drawText(wrappedLine, MARGIN_LEFT, layout.y, { size, color })
      layout.y -= lineHeight
    })
  })
}

const addDetailRows = (layout, rows, options = {}) => {
  const x = options.x ?? MARGIN_LEFT
  const width = options.width ?? CONTENT_WIDTH
  const labelWidth = options.labelWidth ?? 150
  const valueX = x + labelWidth
  const valueWidth = width - labelWidth

  rows
    .filter((row) => isFilled(row.label) && isFilled(row.value))
    .forEach((row) => {
      const valueLines = wrapText(row.value, valueWidth, 10.8)
      const rowHeight = Math.max(27, 10 + valueLines.length * 14)

      layout.ensureSpace(rowHeight)
      const textY = layout.y - 18

      layout.drawText(row.label, x, textY, {
        size: 9.5,
        bold: true,
        color: COLORS.muted
      })
      valueLines.forEach((line, index) => {
        layout.drawText(line, valueX, textY - index * 14, {
          size: 10.8,
          color: COLORS.ink
        })
      })
      layout.drawLine(x, layout.y - rowHeight, x + width, layout.y - rowHeight, 0.45, COLORS.softBorder)
      layout.y -= rowHeight
    })
}

const getProjectRowValue = (data, key) =>
  data.projectRows.find((row) => row.label === key)?.value ?? ''

const drawAppSectionTitle = (layout, title) => {
  layout.ensureSpace(34)
  layout.drawText(title, MARGIN_LEFT, layout.y, {
    size: 12.5,
    bold: true,
    color: COLORS.ink
  })
  layout.y -= 22
}

const drawReadonlyField = (layout, { label, value, x, y, width, valueAlign = 'left' }) => {
  const fieldHeight = 30
  const labelY = y + fieldHeight + 12
  const valueY = y + 10

  layout.drawText(label, x, labelY, {
    size: 9.2,
    color: COLORS.ink
  })
  layout.drawRect(x, y, width, fieldHeight, {
    fillColor: COLORS.white,
    strokeColor: COLORS.border,
    lineWidth: 0.55
  })

  if (valueAlign === 'right') {
    layout.drawRightText(value || '-', x + width - 8, valueY, {
      size: 10.3,
      color: COLORS.ink
    })
    return
  }

  const lines = wrapText(value || '-', width - 14, 9.4).slice(0, 2)
  lines.forEach((line, index) => {
    layout.drawText(line, x + 7, valueY - index * 10.5, {
      size: 9.4,
      color: COLORS.ink
    })
  })
}

const drawReadonlyAmount = (layout, text, rightX, y, options = {}) => {
  layout.drawRightText(formatPanelAmount(text) || '-', rightX, y, {
    size: options.size ?? 9.8,
    bold: Boolean(options.bold),
    color: options.color ?? COLORS.ink
  })
}

const addAppHeader = (layout, data, senderLines, generatedAt) => {
  const offerNumber = formatOfferNumber(data.projektId, generatedAt)

  layout.drawText('Offerte', MARGIN_LEFT, TOP_Y, {
    size: 15,
    bold: true,
    color: COLORS.ink
  })
  layout.drawRightText(`Nr. ${offerNumber}`, CONTENT_RIGHT, TOP_Y, {
    size: 9.8,
    color: COLORS.muted
  })
  layout.drawRightText(formatOfferDate(generatedAt), CONTENT_RIGHT, TOP_Y - 15, {
    size: 9.8,
    color: COLORS.muted
  })
  layout.drawLine(MARGIN_LEFT, TOP_Y - 28, CONTENT_RIGHT, TOP_Y - 28, 0.55, COLORS.softBorder)

  layout.y = TOP_Y - 55

  const fieldGap = 9
  const fieldWidth = (CONTENT_WIDTH - fieldGap * 2) / 3
  const fieldY = layout.y - 42
  const customerLines = getRecipientLines(data)
  const customerValue = customerLines.length > 0 ? customerLines.join(' / ') : 'Ohne Kunde'

  drawReadonlyField(layout, {
    label: 'Kunde',
    value: customerValue,
    x: MARGIN_LEFT,
    y: fieldY,
    width: fieldWidth
  })
  drawReadonlyField(layout, {
    label: 'Verkäufer',
    value: data.sellerName || getProjectRowValue(data, 'Verkäufer') || senderLines[0] || '-',
    x: MARGIN_LEFT + fieldWidth + fieldGap,
    y: fieldY,
    width: fieldWidth
  })
  drawReadonlyField(layout, {
    label: 'Druckermodell',
    value: getProjectRowValue(data, 'Modell') || data.title,
    x: MARGIN_LEFT + fieldWidth * 2 + fieldGap * 2,
    y: fieldY,
    width: fieldWidth
  })

  layout.y = fieldY - 28

  return offerNumber
}

const drawAppPositionsHeader = (layout) => {
  const headerHeight = 25
  const columns = [
    { label: 'Kategorie', width: 0.17, align: 'left' },
    { label: 'Bezeichnung', width: 0.45, align: 'left' },
    { label: 'Menge', width: 0.08, align: 'right' },
    { label: 'VP (CHF)', width: 0.14, align: 'right' },
    { label: 'Total (CHF)', width: 0.16, align: 'right' }
  ]
  let x = MARGIN_LEFT

  layout.drawRect(MARGIN_LEFT, layout.y - headerHeight, CONTENT_WIDTH, headerHeight, {
    fillColor: COLORS.tableHeader,
    strokeColor: COLORS.border,
    lineWidth: 0.5
  })

  columns.forEach((column) => {
    const width = CONTENT_WIDTH * column.width
    const textY = layout.y - 16

    if (column.align === 'right') {
      layout.drawRightText(column.label, x + width - 7, textY, {
        size: 9.2,
        bold: true,
        color: COLORS.muted
      })
    } else {
      layout.drawText(column.label, x + 7, textY, {
        size: 9.2,
        bold: true,
        color: COLORS.muted
      })
    }

    x += width
  })

  layout.y -= headerHeight
}

const addAppPositionsTable = (layout, data, offerNumber) => {
  const columns = [
    { key: 'kategorie', width: 0.17, align: 'left' },
    { key: 'bezeichnung', width: 0.45, align: 'left' },
    { key: 'menge', width: 0.08, align: 'right' },
    { key: 'einzelpreis', width: 0.14, align: 'right' },
    { key: 'total', width: 0.16, align: 'right' }
  ]
  const rows = data.positionRows.length > 0
    ? data.positionRows
    : [{
      kategorie: '',
      bezeichnung: 'Keine Positionen gespeichert.',
      menge: '',
      einzelpreis: '',
      total: ''
    }]

  drawAppSectionTitle(layout, 'Positionen')
  drawAppPositionsHeader(layout)

  rows.forEach((row, rowIndex) => {
    const descriptionLines = wrapText(row.bezeichnung, CONTENT_WIDTH * columns[1].width - 14, 9.4)
    const rowHeight = Math.max(31, 13 + descriptionLines.length * 12)

    if (layout.y - rowHeight < BOTTOM_Y) {
      layout.addPage()
      drawContinuationHeader(layout, {
        offerNumber,
        title: 'Offerte - Positionen'
      })
      drawAppPositionsHeader(layout)
    }

    let x = MARGIN_LEFT
    const bottomY = layout.y - rowHeight

    layout.drawRect(MARGIN_LEFT, bottomY, CONTENT_WIDTH, rowHeight, {
      fillColor: rowIndex % 2 === 0 ? COLORS.white : COLORS.tableStripe,
      strokeColor: COLORS.border,
      lineWidth: 0.45
    })

    columns.forEach((column) => {
      const width = CONTENT_WIDTH * column.width
      const rawValue = row[column.key] ?? ''
      const value = column.key === 'einzelpreis' || column.key === 'total'
        ? formatTableAmount(rawValue)
        : rawValue
      const textY = layout.y - 19

      if (column.key === 'bezeichnung') {
        descriptionLines.forEach((line, index) => {
          layout.drawText(line, x + 7, textY - index * 12, {
            size: 9.4,
            color: COLORS.ink
          })
        })
      } else if (column.align === 'right') {
        layout.drawRightText(value, x + width - 7, textY, {
          size: 9.4,
          color: COLORS.ink
        })
      } else {
        layout.drawText(value, x + 7, textY, {
          size: 9.4,
          color: COLORS.ink
        })
      }

      x += width
    })

    layout.y -= rowHeight
  })
}

const getPriceValue = (data, label) =>
  data.priceRows.find((row) => row.label === label)?.value ?? ''

const addAppCalculationPanel = (layout, data, offerNumber) => {
  if (layout.y - 250 < BOTTOM_Y) {
    layout.addPage()
    drawContinuationHeader(layout, {
      offerNumber,
      title: 'Offerte - Kalkulation'
    })
  }

  layout.addSpacer(24)
  drawAppSectionTitle(layout, 'Kalkulation')

  const panelGap = 14
  const leftWidth = CONTENT_WIDTH * 0.64
  const rightWidth = CONTENT_WIDTH - leftWidth - panelGap
  const topY = layout.y
  const leftX = MARGIN_LEFT
  const rightX = MARGIN_LEFT + leftWidth + panelGap
  const priceRows = [
    ['Verkaufspreis', getPriceValue(data, 'Geräte- und Zubehörpaket')],
    ['Eintauschrabatt', getPriceValue(data, 'Eintauschrabatt')],
    ['Lieferung / Bereitstellung', getPriceValue(data, 'Lieferung / Bereitstellung')],
    [data.priceRows.find((row) => row.label.startsWith('Restwert'))?.label ?? 'Restwert', data.priceRows.find((row) => row.label.startsWith('Restwert'))?.value ?? ''],
    ['Nettopreis', getTotalAmount(data)]
  ].filter((row) => isFilled(row[1]) || row[0] === 'Nettopreis')
  const serviceRows = [...data.rentRows, ...data.serviceRows].slice(0, 8)
  const leftHeight = 34 + priceRows.length * 31
  const rightHeight = 34 + Math.max(serviceRows.length, 1) * 28
  const panelHeight = Math.max(leftHeight, rightHeight)

  layout.drawRect(leftX, topY - panelHeight, leftWidth, panelHeight, {
    fillColor: COLORS.white,
    strokeColor: COLORS.border,
    lineWidth: 0.55
  })
  layout.drawRect(rightX, topY - panelHeight, rightWidth, panelHeight, {
    fillColor: COLORS.white,
    strokeColor: COLORS.border,
    lineWidth: 0.55
  })
  layout.drawText('Preisübersicht', leftX + 12, topY - 20, {
    size: 10.5,
    bold: true,
    color: COLORS.ink
  })
  layout.drawText('Miete / Service', rightX + 12, topY - 20, {
    size: 10.5,
    bold: true,
    color: COLORS.ink
  })
  layout.drawLine(leftX, topY - 31, leftX + leftWidth, topY - 31, 0.45, COLORS.softBorder)
  layout.drawLine(rightX, topY - 31, rightX + rightWidth, topY - 31, 0.45, COLORS.softBorder)

  priceRows.forEach(([label, value], index) => {
    const rowTop = topY - 34 - index * 31
    const isNet = label === 'Nettopreis'

    if (isNet) {
      layout.drawRect(leftX + 7, rowTop - 29, leftWidth - 14, 27, {
        fillColor: COLORS.accentSoft,
        strokeColor: COLORS.accentBorder,
        lineWidth: 0.5
      })
    }

    layout.drawText(label, leftX + 14, rowTop - 19, {
      size: isNet ? 10.2 : 9.6,
      bold: isNet,
      color: isNet ? COLORS.accentDark : COLORS.ink
    })
    drawReadonlyAmount(layout, value, leftX + leftWidth - 14, rowTop - 19, {
      size: isNet ? 10.8 : 9.8,
      bold: isNet,
      color: isNet ? COLORS.accentDark : COLORS.ink
    })

    if (!isNet) {
      layout.drawLine(leftX + 10, rowTop - 29, leftX + leftWidth - 10, rowTop - 29, 0.35, COLORS.softBorder)
    }
  })

  const visibleServiceRows = serviceRows.length > 0
    ? serviceRows
    : [{ label: 'Service', value: 'Keine Servicekonditionen gespeichert.' }]

  visibleServiceRows.forEach((row, index) => {
    const rowTop = topY - 36 - index * 28
    const labelLines = wrapText(row.label, rightWidth * 0.57, 8.7)

    layout.drawText(labelLines[0] ?? row.label, rightX + 12, rowTop - 17, {
      size: 8.7,
      color: COLORS.muted
    })
    layout.drawRightText(row.value, rightX + rightWidth - 12, rowTop - 17, {
      size: 8.9,
      bold: true,
      color: COLORS.ink
    })
    layout.drawLine(rightX + 10, rowTop - 25, rightX + rightWidth - 10, rowTop - 25, 0.35, COLORS.softBorder)
  })

  layout.y = topY - panelHeight - 22
}

const addAppConditions = (layout, data, offerNumber) => {
  const rows = [
    { label: 'Mehrwertsteuer', value: 'Preise inkl. MwSt., sofern nicht anders vereinbart.' },
    { label: 'Gültigkeit', value: 'Diese Offerte ist 30 Tage ab Offertdatum gültig.' },
    ...data.conditionRows
  ]

  if (layout.y - 130 < BOTTOM_Y) {
    layout.addPage()
    drawContinuationHeader(layout, {
      offerNumber,
      title: 'Offerte - Konditionen'
    })
  }

  drawAppSectionTitle(layout, 'Konditionen')
  addDetailRows(layout, rows, {
    labelWidth: 180
  })
}

const addAppSignature = (layout, data, senderLines, offerNumber) => {
  if (layout.y - 125 < BOTTOM_Y) {
    layout.addPage()
    drawContinuationHeader(layout, {
      offerNumber,
      title: 'Offerte - Annahme'
    })
  }

  layout.addSpacer(24)
  const signatureTop = layout.y
  const signatureWidth = (CONTENT_WIDTH - 34) / 2
  const rightX = MARGIN_LEFT + signatureWidth + 34
  const customerContact = data.customer.contact || data.customer.name || ''

  layout.drawText('Freundliche Grüsse', MARGIN_LEFT, signatureTop, {
    size: 10.5,
    color: COLORS.ink
  })
  layout.drawText('Auftraggeber', rightX, signatureTop, {
    size: 10.5,
    color: COLORS.ink
  })
  layout.drawLine(MARGIN_LEFT, signatureTop - 42, MARGIN_LEFT + signatureWidth, signatureTop - 42, 0.65, COLORS.border)
  layout.drawLine(rightX, signatureTop - 42, rightX + signatureWidth, signatureTop - 42, 0.65, COLORS.border)
  layout.drawText(senderLines[0] ?? '', MARGIN_LEFT, signatureTop - 58, {
    size: 9.5,
    color: COLORS.muted
  })
  layout.drawText(customerContact || data.customer.name || '', rightX, signatureTop - 58, {
    size: 9.5,
    color: COLORS.muted
  })
  layout.y = signatureTop - 90
}

const addToolStyleOfferContent = (layout, data, generatedAt, senderLines) => {
  const offerNumber = addAppHeader(layout, data, senderLines, generatedAt)

  addAppPositionsTable(layout, data, offerNumber)
  addAppCalculationPanel(layout, data, offerNumber)
  addAppConditions(layout, data, offerNumber)
  addAppSignature(layout, data, senderLines, offerNumber)
}

const addOfferContent = (layout, data, generatedAt, senderLines) => {
  const customerContact = data.customer.contact || data.customer.name || ''
  const tableRows = getOfferTableRows(data)
  const offerNumber = addDocumentHeader(layout, senderLines, data, generatedAt)

  addRecipientAndSummary(layout, data)

  layout.addHeading('Offerte', { size: 20, after: 24 })
  layout.addParagraph(customerContact ? `Guten Tag ${customerContact}` : 'Guten Tag', {
    after: 4
  })
  layout.addParagraph('Besten Dank für Ihre Anfrage. Wir haben die gewünschte Lösung kompakt für Sie zusammengestellt.', {
    color: COLORS.muted,
    after: 8
  })
  layout.addParagraph(
    `Für ${data.title || 'die ausgewählte Lösung'} offerieren wir Ihnen folgende Zusammenstellung.`,
    {
      size: 12.5,
      lineHeight: 17,
      bold: true,
      after: 12
    }
  )

  layout.addSubheading('Angebotene Positionen', { after: 12 })
  addOfferTable(layout, tableRows, { offerNumber })
  layout.addSpacer(20)

  const rentAndServiceRows = [...data.rentRows, ...data.serviceRows]
  const detailRows = [
    {
      label: 'Mehrwertsteuer',
      value: 'Preise inkl. MwSt., sofern nicht anders vereinbart.'
    },
    {
      label: 'Gültigkeit',
      value: 'Diese Offerte ist 30 Tage ab Offertdatum gültig.'
    },
    ...rentAndServiceRows,
    ...data.conditionRows
  ]

  if (layout.y - 150 < BOTTOM_Y) {
    layout.addPage()
    drawContinuationHeader(layout, {
      offerNumber,
      title: 'Offerte - Konditionen'
    })
  }

  layout.addSubheading('Konditionen', { after: 16 })
  addDetailRows(layout, detailRows)

  layout.addSpacer(22)

  if (layout.y - 190 < BOTTOM_Y) {
    layout.addPage()
    drawContinuationHeader(layout, {
      offerNumber,
      title: 'Offerte - Annahme'
    })
  }

  layout.addSubheading('Annahme', { after: 16 })
  layout.addParagraph(
    'Mit Ihrer Unterschrift bestätigen Sie die Annahme dieser Offerte und beauftragen die Umsetzung zu den oben genannten Konditionen.',
    {
      color: COLORS.muted,
      after: 28
    }
  )
  layout.ensureSpace(95)
  const signatureTop = layout.y
  const signatureWidth = 188
  const signatureRightX = MARGIN_LEFT + CONTENT_WIDTH - signatureWidth

  layout.drawText('Freundliche Grüsse', MARGIN_LEFT, signatureTop, {
    size: DEFAULT_FONT_SIZE,
    color: COLORS.ink
  })
  layout.drawText('Auftraggeber', signatureRightX, signatureTop, {
    size: DEFAULT_FONT_SIZE,
    color: COLORS.ink
  })
  layout.drawLine(MARGIN_LEFT, signatureTop - 42, MARGIN_LEFT + signatureWidth, signatureTop - 42, 0.65, COLORS.border)
  layout.drawLine(signatureRightX, signatureTop - 42, signatureRightX + signatureWidth, signatureTop - 42, 0.65, COLORS.border)
  layout.drawText(senderLines[0] ?? '', MARGIN_LEFT, signatureTop - 58, {
    size: 10,
    color: COLORS.muted
  })
  layout.drawText(customerContact || data.customer.name || '', signatureRightX, signatureTop - 58, {
    size: 10,
    color: COLORS.muted
  })
  layout.y = signatureTop - 95
}

const TEMPLATE = {
  x: 54,
  top: 790,
  width: PAGE_WIDTH - 108,
  border: [0.78, 0.81, 0.86],
  faintBorder: [0.78, 0.81, 0.86],
  headerFill: COLORS.accentDark,
  lightFill: [0.985, 0.988, 0.992]
}

const TEMPLATE_TABLE_HEADER_HEIGHT = 28
const TEMPLATE_ROW_HEIGHT = 19
const TEMPLATE_BLANK_ROW_HEIGHT = TEMPLATE_ROW_HEIGHT
const TEMPLATE_TOTALS_SPACER_HEIGHT = TEMPLATE_BLANK_ROW_HEIGHT
const TEMPLATE_CLOSING_BASE_HEIGHT = 255 + TEMPLATE_TOTALS_SPACER_HEIGHT

const templateColumns = [
  { key: 'pos', label: 'Pos.', width: 31, align: 'center' },
  { key: 'description', label: 'Beschreibung', width: 204, align: 'left' },
  { key: 'quantity', label: 'Menge', width: 42, align: 'right' },
  { key: 'unit', label: 'Einheit', width: 42, align: 'center' },
  { key: 'unitPrice', label: 'Einzelpreis CHF', width: 86, align: 'right' },
  { key: 'amount', label: 'Betrag CHF', width: TEMPLATE.width - 31 - 204 - 42 - 42 - 86, align: 'right' }
]

const drawTemplateCell = (layout, x, topY, width, height, options = {}) => {
  layout.drawRect(x, topY - height, width, height, {
    fillColor: options.fillColor,
    strokeColor: options.strokeColor ?? TEMPLATE.border,
    lineWidth: options.lineWidth ?? 0.45
  })

  if (!isFilled(options.text)) {
    return
  }

  const fontSize = options.size ?? 8.8
  const textColor = options.color ?? COLORS.ink
  const bold = Boolean(options.bold)
  const paddingX = options.paddingX ?? 4
  const lineHeight = options.lineHeight ?? fontSize + 2.2
  const maxLines = options.maxLines ?? 2
  const lines = wrapText(options.text, width - paddingX * 2, fontSize, bold).slice(0, maxLines)
  const firstLineY = topY - (height - lines.length * lineHeight) / 2 - fontSize

  lines.forEach((line, index) => {
    const textY = firstLineY - index * lineHeight

    if (options.align === 'right') {
      layout.drawRightText(line, x + width - paddingX, textY, {
        size: fontSize,
        bold,
        color: textColor
      })
      return
    }

    if (options.align === 'center') {
      const textX = x + width / 2 - estimateTextWidth(line, fontSize, bold) / 2

      layout.drawText(line, textX, textY, {
        size: fontSize,
        bold,
        color: textColor
      })
      return
    }

    layout.drawText(line, x + paddingX, textY, {
      size: fontSize,
      bold,
      color: textColor
    })
  })
}

const drawTemplateFullRow = (layout, topY, height, text, options = {}) => {
  drawTemplateCell(layout, TEMPLATE.x, topY, TEMPLATE.width, height, {
    text,
    fillColor: options.fillColor,
    strokeColor: options.strokeColor ?? TEMPLATE.border,
    size: options.size ?? 8.7,
    bold: Boolean(options.bold),
    color: options.color ?? COLORS.ink,
    align: options.align ?? 'left',
    paddingX: options.paddingX ?? 4,
    maxLines: options.maxLines ?? 1
  })
}

const getTemplateSenderRows = (senderLines) => ({
  name: senderLines[0] ?? DEFAULT_SENDER_LINES[0],
  address: senderLines[1] ?? '',
  location: senderLines[2] ?? '',
  contact: senderLines.slice(3).filter(isFilled).join(' / ')
})

const getTemplateRecipientRows = (data) => ({
  name: data.customer.name || 'Demo Kunde AG',
  contact: data.customer.contact,
  address: data.customer.address,
  location: data.customer.location
})

const getTemplateRows = (data) => {
  return data.positionRows.map((row, index) => ({
    pos: String(index + 1),
    description: row.bezeichnung,
    quantity: row.menge || '1',
    unit: 'Stk.',
    unitPrice: formatTableAmount(row.einzelpreis),
    amount: formatTableAmount(row.total)
  }))
}

const getTemplateSubtotal = (data) =>
  formatTableAmount(
    data.priceRows.find((row) => row.label === 'Geräte- und Zubehörpaket')?.value ??
      data.priceRows.find((row) => !row.isTotal)?.value ??
      ''
  )

const getTemplateAdjustmentRows = (data) =>
  data.priceRows
    .filter((row) => !row.isTotal && row.label !== 'Geräte- und Zubehörpaket')
    .map((row) => ({
      label: row.label,
      value: formatTableAmount(row.value)
    }))
    .filter((row) => isFilled(row.label) || isFilled(row.value))

const getTemplateClosingHeight = (adjustmentRows) =>
  TEMPLATE_CLOSING_BASE_HEIGHT + adjustmentRows.length * TEMPLATE_ROW_HEIGHT

const drawTemplateLineRow = (layout, topY, row, height = 19) => {
  let x = TEMPLATE.x

  templateColumns.forEach((column) => {
    drawTemplateCell(layout, x, topY, column.width, height, {
      text: row[column.key] ?? '',
      strokeColor: TEMPLATE.faintBorder,
      size: column.key === 'description' ? 8.4 : 8.2,
      align: column.align,
      maxLines: column.key === 'description' ? 2 : 1
    })
    x += column.width
  })
}

const getTemplateLineRowHeight = (row) => {
  const description = row.description ?? ''
  const descriptionWidth = templateColumns.find((column) => column.key === 'description')?.width ?? 0
  const descriptionLines = wrapText(description, descriptionWidth - 8, 8.4).slice(0, 2)

  return descriptionLines.length > 1 ? 26 : TEMPLATE_ROW_HEIGHT
}

const drawTemplateTableHeader = (layout, topY) => {
  let x = TEMPLATE.x

  templateColumns.forEach((column) => {
    drawTemplateCell(layout, x, topY, column.width, TEMPLATE_TABLE_HEADER_HEIGHT, {
      text: column.label,
      fillColor: TEMPLATE.headerFill,
      strokeColor: TEMPLATE.headerFill,
      size: 8.6,
      bold: true,
      color: COLORS.white,
      align: column.align
    })
    x += column.width
  })
}

const drawTemplateContinuationPage = (layout) => {
  layout.addPage()
  let y = TEMPLATE.top

  drawTemplateTableHeader(layout, y)

  return y - TEMPLATE_TABLE_HEADER_HEIGHT
}

const ensureTemplatePageSpace = (layout, y, requiredHeight) => {
  if (y - requiredHeight >= BOTTOM_Y) {
    return y
  }

  return drawTemplateContinuationPage(layout)
}

const addTemplatePageNumbers = (layout) => {
  const pageCount = layout.pages.length

  if (pageCount < 2) {
    return
  }

  layout.pages.forEach((pageOperations, index) => {
    const label = `Seite ${index + 1} / ${pageCount}`
    const size = 7.8
    const x = TEMPLATE.x + TEMPLATE.width - estimateTextWidth(label, size)
    const y = 30

    pageOperations.push(
      `${colorOperator(COLORS.softText, 'rg')} BT /F1 ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td <${encodeWinAnsiHex(label)}> Tj ET`
    )
  })
}

const drawTemplateTotalRow = (layout, topY, label, value, options = {}) => {
  const valueWidth = templateColumns.at(-1).width
  const labelWidth = TEMPLATE.width - valueWidth
  const valueX = TEMPLATE.x + labelWidth
  const rowHeight = options.height ?? 19
  const fontSize = options.bold ? 9.2 : 8.4
  const bold = Boolean(options.bold)
  const color = options.color ?? COLORS.ink
  const paddingX = 4
  const textY = topY - (rowHeight - (fontSize + 2.2)) / 2 - fontSize

  drawTemplateCell(layout, TEMPLATE.x, topY, TEMPLATE.width, rowHeight, {
    strokeColor: TEMPLATE.faintBorder
  })
  layout.drawLine(valueX, topY, valueX, topY - rowHeight, 0.45, TEMPLATE.faintBorder)
  layout.drawRightText(label, valueX - paddingX, textY, {
    size: fontSize,
    bold,
    color
  })
  layout.drawRightText(value, TEMPLATE.x + TEMPLATE.width - paddingX, textY, {
    size: fontSize,
    bold,
    color
  })
}

const addTemplateOfferContent = (layout, data, generatedAt, senderLines) => {
  const sender = getTemplateSenderRows(senderLines)
  const recipient = getTemplateRecipientRows(data)
  const offerNumber = formatOfferNumber(data.projektId, generatedAt)
  const totalAmount = formatTableAmount(getTotalAmount(data))
  const rows = getTemplateRows(data)
  const displayRows = rows
  const adjustmentRows = getTemplateAdjustmentRows(data)
  const templateClosingHeight = getTemplateClosingHeight(adjustmentRows)
  const x = TEMPLATE.x
  const w = TEMPLATE.width
  const leftW = w * 0.5
  const rightW = w - leftW
  const rightX = x + leftW
  let y = TEMPLATE.top

  drawTemplateCell(layout, x, y, leftW, 46, {
    text: sender.name,
    size: 14,
    bold: true,
    color: COLORS.accentDark,
    maxLines: 1
  })
  drawTemplateCell(layout, rightX, y, rightW, 15, {
    text: 'Angebotsempfänger',
    size: 7.4,
    color: COLORS.softText
  })
  drawTemplateCell(layout, rightX, y - 15, rightW, 31, {
    text: recipient.name,
    size: 9,
    bold: true,
    maxLines: 2
  })
  y -= 46

  drawTemplateCell(layout, x, y, leftW, 18, {
    text: sender.address,
    size: 8.2
  })
  drawTemplateCell(layout, rightX, y, rightW, 18, {
    text: recipient.address,
    size: 8.2
  })
  y -= 18

  drawTemplateCell(layout, x, y, leftW, 18, {
    text: sender.location,
    size: 8.2
  })
  drawTemplateCell(layout, rightX, y, rightW, 18, {
    text: recipient.location,
    size: 8.2
  })
  y -= 18

  if (isFilled(sender.contact)) {
    drawTemplateCell(layout, x, y, leftW, 18, {
      text: sender.contact,
      size: 8.2
    })
    drawTemplateCell(layout, rightX, y, rightW, 18, {
      text: '',
      size: 8.2
    })
    y -= 18
  }

  drawTemplateFullRow(layout, y, TEMPLATE_BLANK_ROW_HEIGHT, '')
  y -= TEMPLATE_BLANK_ROW_HEIGHT

  drawTemplateFullRow(layout, y, 34, 'OFFERTE', {
    size: 19,
    bold: true,
    color: COLORS.accentDark
  })
  y -= 34

  const metaLabelW = 54
  const metaValueW = leftW - metaLabelW
  const metaRightLabelW = 68
  const metaRightValueW = rightW - metaRightLabelW

  drawTemplateCell(layout, x, y, metaLabelW, 18, {
    text: 'Offert-Nr.:',
    size: 7.8,
    bold: true
  })
  drawTemplateCell(layout, x + metaLabelW, y, metaValueW, 18, {
    text: offerNumber,
    size: 8.2
  })
  drawTemplateCell(layout, rightX, y, metaRightLabelW, 18, {
    text: 'Datum:',
    size: 8,
    bold: true
  })
  drawTemplateCell(layout, rightX + metaRightLabelW, y, metaRightValueW, 18, {
    text: formatOfferDate(generatedAt),
    size: 8.2,
    align: 'right'
  })
  y -= 18

  drawTemplateCell(layout, x, y, leftW, 18, {})
  drawTemplateCell(layout, rightX, y, metaRightLabelW, 18, {
    text: 'Gültig bis:',
    size: 8,
    bold: true
  })
  drawTemplateCell(layout, rightX + metaRightLabelW, y, metaRightValueW, 18, {
    text: '30 Tage',
    size: 8.2,
    align: 'right'
  })
  y -= 18

  drawTemplateFullRow(layout, y, TEMPLATE_BLANK_ROW_HEIGHT, '')
  y -= TEMPLATE_BLANK_ROW_HEIGHT
  drawTemplateFullRow(layout, y, 22, 'Gerne unterbreiten wir Ihnen folgendes Angebot:', {
    size: 8.4
  })
  y -= 22

  drawTemplateTableHeader(layout, y)
  y -= TEMPLATE_TABLE_HEADER_HEIGHT

  displayRows.forEach((row, rowIndex) => {
    const isLastRow = rowIndex === displayRows.length - 1
    const rowHeight = getTemplateLineRowHeight(row)
    const requiredHeight = isLastRow
      ? rowHeight + templateClosingHeight
      : rowHeight

    y = ensureTemplatePageSpace(layout, y, requiredHeight)
    drawTemplateLineRow(layout, y, row, rowHeight)
    y -= rowHeight
  })

  y = ensureTemplatePageSpace(layout, y, templateClosingHeight)

  drawTemplateFullRow(layout, y, TEMPLATE_TOTALS_SPACER_HEIGHT, '', {
    strokeColor: TEMPLATE.faintBorder
  })
  y -= TEMPLATE_TOTALS_SPACER_HEIGHT

  drawTemplateTotalRow(layout, y, 'Zwischensumme:', getTemplateSubtotal(data))
  y -= TEMPLATE_ROW_HEIGHT

  adjustmentRows.forEach((row) => {
    drawTemplateTotalRow(layout, y, `${row.label}:`, row.value)
    y -= TEMPLATE_ROW_HEIGHT
  })

  drawTemplateTotalRow(layout, y, 'Gesamtbetrag:', totalAmount, {
    bold: true,
    color: COLORS.accentDark,
    height: 21
  })
  y -= 21

  drawTemplateFullRow(layout, y, TEMPLATE_BLANK_ROW_HEIGHT, '')
  y -= TEMPLATE_BLANK_ROW_HEIGHT
  drawTemplateFullRow(layout, y, 20, 'Bedingungen', {
    size: 10,
    bold: true,
    color: COLORS.ink
  })
  y -= 20
  drawTemplateFullRow(layout, y, 18, 'Zahlungsbedingungen: 30 Tage netto nach Rechnungsstellung', {
    size: 8.2
  })
  y -= 18
  drawTemplateFullRow(layout, y, 18, 'Alle Preise in CHF, inkl. MwSt. Preisänderungen vorbehalten.', {
    size: 8.2
  })
  y -= 18

  const serviceLine = [...data.rentRows, ...data.serviceRows]
    .slice(0, 2)
    .map((row) => `${row.label}: ${row.value}`)
    .join(' | ')

  if (isFilled(serviceLine)) {
    drawTemplateFullRow(layout, y, 18, serviceLine, {
      size: 7.8,
      maxLines: 1
    })
    y -= 18
  }

  drawTemplateFullRow(layout, y, TEMPLATE_BLANK_ROW_HEIGHT, '')
  y -= TEMPLATE_BLANK_ROW_HEIGHT
  drawTemplateFullRow(layout, y, 20, 'Annahme der Offerte', {
    size: 10,
    bold: true,
    color: COLORS.ink
  })
  y -= 20
  drawTemplateCell(layout, x, y, leftW, 24, {
    text: 'Ort, Datum: ___________________________',
    size: 8.2
  })
  drawTemplateCell(layout, rightX, y, rightW, 24, {
    text: 'Unterschrift: ___________________________',
    size: 8.2
  })
  y -= 24

  drawTemplateFullRow(layout, y, TEMPLATE_BLANK_ROW_HEIGHT, '')
}

export const buildOffertePdfBytes = (options) => {
  const generatedAt = options.generatedAt ?? new Date()
  const senderLines = options.senderLines ?? DEFAULT_SENDER_LINES
  const data = createOfferteDocumentData({
    ...options,
    generatedAt
  })
  const layout = new PdfLayout()

  addTemplateOfferContent(layout, data, generatedAt, senderLines)
  addTemplatePageNumbers(layout)

  return createPdfBytes(layout.pages)
}

export const buildOffertePdfFilename = ({ projekt, generatedAt = new Date() }) => {
  const data = createOfferteDocumentData({
    projekt,
    generatedAt
  })
  const title = sanitizeFilenamePart(data.title) || 'Offerte'
  const offerNumber = formatOfferNumber(data.projektId, generatedAt)

  return `Offerte ${offerNumber} ${title}.pdf`
}
