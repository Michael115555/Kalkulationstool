const http = require('node:http')
const https = require('node:https')

const targetUrl = process.argv[2]
const timeoutMs = Number(process.argv[3] || 30000)
const intervalMs = 300
const startedAt = Date.now()

if (!targetUrl) {
  console.error('Usage: node scripts/wait-for-health.js <url> [timeoutMs]')
  process.exit(1)
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const requestHealth = () =>
  new Promise((resolve) => {
    const url = new URL(targetUrl)
    const client = url.protocol === 'https:' ? https : http

    const request = client.get(url, (response) => {
      response.resume()
      resolve(response.statusCode >= 200 && response.statusCode < 300)
    })

    request.on('error', () => resolve(false))
    request.setTimeout(1000, () => {
      request.destroy()
      resolve(false)
    })
  })

const waitForHealth = async () => {
  process.stdout.write(`Warte auf ${targetUrl}`)

  while (Date.now() - startedAt < timeoutMs) {
    if (await requestHealth()) {
      process.stdout.write('\nBackend ist bereit.\n')
      return
    }

    process.stdout.write('.')
    await wait(intervalMs)
  }

  process.stdout.write('\n')
  console.error(`Backend wurde nicht innerhalb von ${timeoutMs}ms bereit.`)
  process.exit(1)
}

waitForHealth()
