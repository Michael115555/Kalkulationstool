import { createOfferteDocumentData } from './offerteDocument'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const BOTTOM_Y = 54
const DEFAULT_FONT_SIZE = 12

const COLORS = {
  accentDark: [0.05, 0.43, 0.99],
  ink: [0.12, 0.16, 0.22],
  muted: [0.33, 0.37, 0.43],
  softText: [0.43, 0.47, 0.52],
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

const addDays = (dateValue, days) => {
  const date = new Date(dateValue)
  date.setDate(date.getDate() + days)

  return date
}

const formatOfferValidUntilDate = (generatedAt) => formatOfferDate(addDays(generatedAt, 30))

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
    this.addPage()
  }

  addPage() {
    this.currentPage = []
    this.pages.push(this.currentPage)
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

const getTotalAmount = (data) => {
  const totalRow = data.priceRows.find((row) => row.isTotal)
  const amount = formatTableAmount(totalRow?.value ?? '')

  return amount ? formatTotalAmount(amount) : ''
}

const formatTotalAmount = (amount) => {
  const text = sanitizeText(amount)

  if (!text) {
    return ''
  }

  return /^CHF\s/i.test(text) ? text : `CHF ${text}`
}

const TEMPLATE = {
  x: 54,
  top: 812,
  width: PAGE_WIDTH - 108,
  border: [0.86, 0.88, 0.92],
  faintBorder: [0.9, 0.92, 0.95],
  headerFill: COLORS.accentDark,
  lightFill: [0.985, 0.988, 0.992],
  lineWidth: 0.32
}

const TEMPLATE_TABLE_HEADER_HEIGHT = 28
const TEMPLATE_ROW_HEIGHT = 19
const TEMPLATE_BLANK_ROW_HEIGHT = TEMPLATE_ROW_HEIGHT
const TEMPLATE_TOTALS_SPACER_HEIGHT = TEMPLATE_BLANK_ROW_HEIGHT
const TEMPLATE_TOTAL_ROW_HEIGHT = 21
const TEMPLATE_DETAIL_TITLE_HEIGHT = 20
const TEMPLATE_DETAIL_ROW_HEIGHT = 20
const TEMPLATE_CONDITIONS_BASE_HEIGHT = TEMPLATE_BLANK_ROW_HEIGHT + 20 + 18 + 18
const TEMPLATE_ACCEPTANCE_HEIGHT = TEMPLATE_BLANK_ROW_HEIGHT + 20 + 24 + TEMPLATE_BLANK_ROW_HEIGHT

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
    lineWidth: options.lineWidth ?? TEMPLATE.lineWidth
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

const getTemplateTotalsHeight = (adjustmentRows) =>
  TEMPLATE_TOTALS_SPACER_HEIGHT +
  TEMPLATE_ROW_HEIGHT +
  adjustmentRows.length * TEMPLATE_ROW_HEIGHT +
  TEMPLATE_TOTAL_ROW_HEIGHT

const getTemplateDetailRows = (rows) =>
  rows
    .map((row) => ({
      label: sanitizeText(row.label),
      value: sanitizeText(row.value)
    }))
    .filter((row) => isFilled(row.label) || isFilled(row.value))

const getTemplateDetailSections = (data) =>
  [
    { title: 'Mietoptionen', rows: getTemplateDetailRows(data.rentRows) },
    { title: 'Servicekonditionen', rows: getTemplateDetailRows(data.serviceRows) }
  ].filter((section) => section.rows.length > 0)

const getTemplateDetailSectionHeight = (section) =>
  TEMPLATE_BLANK_ROW_HEIGHT +
  TEMPLATE_DETAIL_TITLE_HEIGHT +
  Math.ceil(section.rows.length / 2) * TEMPLATE_DETAIL_ROW_HEIGHT

const isTemplatePageTop = (y) => Math.abs(y - TEMPLATE.top) < 0.01

const drawTemplateSectionSpacer = (layout, y, options = {}) => {
  if (isTemplatePageTop(y)) {
    return y
  }

  if (options.skipTopBorder) {
    const bottomY = y - TEMPLATE_BLANK_ROW_HEIGHT
    const lineWidth = options.lineWidth ?? TEMPLATE.lineWidth
    const strokeColor = options.strokeColor ?? TEMPLATE.border

    layout.drawLine(TEMPLATE.x, y, TEMPLATE.x, bottomY, lineWidth, strokeColor)
    layout.drawLine(
      TEMPLATE.x + TEMPLATE.width,
      y,
      TEMPLATE.x + TEMPLATE.width,
      bottomY,
      lineWidth,
      strokeColor
    )
    layout.drawLine(TEMPLATE.x, bottomY, TEMPLATE.x + TEMPLATE.width, bottomY, lineWidth, strokeColor)

    return bottomY
  }

  drawTemplateFullRow(layout, y, TEMPLATE_BLANK_ROW_HEIGHT, '', {
    strokeColor: options.strokeColor
  })

  return y - TEMPLATE_BLANK_ROW_HEIGHT
}

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

const ensureTemplatePageSpace = (layout, y, requiredHeight, options = {}) => {
  if (y - requiredHeight >= BOTTOM_Y) {
    return y
  }

  if (options.tableHeader === false) {
    layout.addPage()
    return TEMPLATE.top
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
  const valueX = TEMPLATE.x + TEMPLATE.width - valueWidth
  const rowHeight = options.height ?? 19
  const fontSize = options.bold ? 9.2 : 8.4
  const bold = Boolean(options.bold)
  const color = options.color ?? COLORS.ink
  const paddingX = 4
  const textY = topY - (rowHeight - (fontSize + 2.2)) / 2 - fontSize
  const lineColor = options.lineColor ?? TEMPLATE.faintBorder
  const strokeColor = options.strokeColor ?? TEMPLATE.faintBorder
  const lineWidth = options.lineWidth ?? TEMPLATE.lineWidth

  layout.drawRect(TEMPLATE.x, topY - rowHeight, TEMPLATE.width, rowHeight, {
    strokeColor,
    lineWidth
  })
  if (options.showValueSeparator !== false) {
    layout.drawLine(valueX, topY, valueX, topY - rowHeight, lineWidth, strokeColor)
  }

  if (options.topLine) {
    layout.drawLine(
      TEMPLATE.x,
      topY,
      TEMPLATE.x + TEMPLATE.width,
      topY,
      options.topLineWidth ?? 0.65,
      lineColor
    )
  }

  layout.drawText(label, TEMPLATE.x + paddingX, textY, {
    size: fontSize,
    bold,
    color
  })
  layout.drawRightText(value, TEMPLATE.x + TEMPLATE.width - paddingX, textY, {
    size: fontSize,
    bold,
    color
  })

  if (options.bottomLine) {
    layout.drawLine(
      TEMPLATE.x,
      topY - rowHeight,
      TEMPLATE.x + TEMPLATE.width,
      topY - rowHeight,
      options.bottomLineWidth ?? 0.65,
      lineColor
    )
  }
}

const formatTemplateDetailText = (row) => {
  if (!isFilled(row.label)) {
    return row.value
  }

  if (!isFilled(row.value)) {
    return row.label
  }

  return `${row.label}: ${row.value}`
}

const drawTemplateDetailSection = (layout, y, section, options = {}) => {
  y = drawTemplateSectionSpacer(layout, y, {
    strokeColor: TEMPLATE.faintBorder,
    skipTopBorder: options.skipTopBorder
  })

  drawTemplateFullRow(layout, y, TEMPLATE_DETAIL_TITLE_HEIGHT, section.title, {
    size: 10,
    bold: true,
    color: COLORS.ink
  })
  y -= TEMPLATE_DETAIL_TITLE_HEIGHT

  const columnWidth = TEMPLATE.width / 2

  for (let index = 0; index < section.rows.length; index += 2) {
    const leftRow = section.rows[index]
    const rightRow = section.rows[index + 1]

    drawTemplateCell(layout, TEMPLATE.x, y, columnWidth, TEMPLATE_DETAIL_ROW_HEIGHT, {
      text: formatTemplateDetailText(leftRow),
      size: 8.2,
      maxLines: 1,
      strokeColor: TEMPLATE.faintBorder
    })
    drawTemplateCell(layout, TEMPLATE.x + columnWidth, y, columnWidth, TEMPLATE_DETAIL_ROW_HEIGHT, {
      text: rightRow ? formatTemplateDetailText(rightRow) : '',
      size: 8.2,
      maxLines: 1,
      strokeColor: TEMPLATE.faintBorder
    })
    y -= TEMPLATE_DETAIL_ROW_HEIGHT
  }

  return y
}

const addTemplateOfferContent = (layout, data, generatedAt, senderLines) => {
  const sender = getTemplateSenderRows(senderLines)
  const recipient = getTemplateRecipientRows(data)
  const offerNumber = formatOfferNumber(data.projektId, generatedAt)
  const validUntilDate = formatOfferValidUntilDate(generatedAt)
  const totalAmount = formatTableAmount(getTotalAmount(data))
  const rows = getTemplateRows(data)
  const displayRows = rows
  const adjustmentRows = getTemplateAdjustmentRows(data)
  const detailSections = getTemplateDetailSections(data)
  const templateTotalsHeight = getTemplateTotalsHeight(adjustmentRows)
  const x = TEMPLATE.x
  const w = TEMPLATE.width
  const leftW = w * 0.5
  const rightW = w - leftW
  const rightX = x + leftW
  const sellerLine = [data.sellerName, sender.contact].filter(isFilled).map(sanitizeText).join(' / ')
  const recipientContactLine = sanitizeText(recipient.contact)
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

  if (isFilled(sellerLine) || isFilled(recipientContactLine)) {
    drawTemplateCell(layout, x, y, leftW, 18, {
      text: sellerLine,
      size: 8.2
    })
    drawTemplateCell(layout, rightX, y, rightW, 18, {
      text: recipientContactLine,
      size: 8.2
    })
    y -= 18
  }

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
    text: validUntilDate,
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
      ? rowHeight + templateTotalsHeight
      : rowHeight

    y = ensureTemplatePageSpace(layout, y, requiredHeight)
    drawTemplateLineRow(layout, y, row, rowHeight)
    y -= rowHeight
  })

  y = ensureTemplatePageSpace(layout, y, templateTotalsHeight, { tableHeader: false })

  drawTemplateFullRow(layout, y, TEMPLATE_TOTALS_SPACER_HEIGHT, '', {
    strokeColor: TEMPLATE.faintBorder
  })
  y -= TEMPLATE_TOTALS_SPACER_HEIGHT

  drawTemplateTotalRow(layout, y, 'Zwischensumme', getTemplateSubtotal(data), {
    topLine: true,
    showValueSeparator: false
  })
  y -= TEMPLATE_ROW_HEIGHT

  adjustmentRows.forEach((row) => {
    drawTemplateTotalRow(layout, y, row.label, row.value, {
      showValueSeparator: false
    })
    y -= TEMPLATE_ROW_HEIGHT
  })

  drawTemplateTotalRow(layout, y, 'GESAMT', formatTotalAmount(totalAmount) || 'CHF -', {
    bold: true,
    color: COLORS.accentDark,
    height: TEMPLATE_TOTAL_ROW_HEIGHT,
    topLine: true,
    bottomLine: true,
    topLineWidth: 0.55,
    bottomLineWidth: 0.55,
    lineColor: COLORS.muted,
    showValueSeparator: false
  })
  y -= TEMPLATE_TOTAL_ROW_HEIGHT

  let shouldPreserveTotalBottomLine = true

  detailSections.forEach((section) => {
    y = ensureTemplatePageSpace(layout, y, getTemplateDetailSectionHeight(section), {
      tableHeader: false
    })
    y = drawTemplateDetailSection(layout, y, section, {
      skipTopBorder: shouldPreserveTotalBottomLine
    })
    shouldPreserveTotalBottomLine = false
  })

  y = ensureTemplatePageSpace(layout, y, TEMPLATE_CONDITIONS_BASE_HEIGHT, { tableHeader: false })

  y = drawTemplateSectionSpacer(layout, y, {
    skipTopBorder: shouldPreserveTotalBottomLine
  })
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
  drawTemplateFullRow(layout, y, 18, 'Alle Preise in CHF, inkl. MWST; Preisänderungen nach Ablauf der Angebotsfrist vorbehalten.', {
    size: 8.2
  })
  y -= 18

  y = ensureTemplatePageSpace(layout, y, TEMPLATE_ACCEPTANCE_HEIGHT, { tableHeader: false })

  y = drawTemplateSectionSpacer(layout, y)
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
