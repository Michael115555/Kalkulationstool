const net = require('node:net')

const port = Number(process.argv[2] || process.env.PORT || 3001)

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  console.error(`Ungueltiger Port: ${process.argv[2] || process.env.PORT}`)
  process.exit(1)
}

const probe = net.createServer()

probe.once('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} ist bereits belegt. Bitte beende den laufenden Backend-Prozess und versuche es erneut.`)
    process.exit(1)
  }

  console.error(`Port ${port} konnte nicht geprueft werden: ${error.message}`)
  process.exit(1)
})

probe.once('listening', () => {
  probe.close(() => process.exit(0))
})

probe.listen(port)
