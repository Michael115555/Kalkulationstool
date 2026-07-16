const { execFileSync } = require('node:child_process')
const net = require('node:net')

const ports = (process.argv.length > 2 ? process.argv.slice(2) : [process.env.PORT || 3001])
  .map((value) => Number(value))
const gracefulTimeoutMs = 5000
const forceTimeoutMs = 2000

const invalidPort = ports.find((port) => !Number.isInteger(port) || port <= 0 || port > 65535)

if (invalidPort) {
  console.error(`Ungueltiger Port: ${invalidPort}`)
  process.exit(1)
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const canListen = (port) =>
  new Promise((resolve, reject) => {
    const probe = net.createServer()

    probe.once('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        resolve(false)
        return
      }

      reject(error)
    })

    probe.once('listening', () => {
      probe.close(() => resolve(true))
    })

    probe.listen(port)
  })

const getListeningPids = (port) => {
  try {
    const output = execFileSync('lsof', [`-tiTCP:${port}`, '-sTCP:LISTEN'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    })

    return [...new Set(output
      .split('\n')
      .map((value) => Number(value.trim()))
      .filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid))]
  } catch (error) {
    return []
  }
}

const getCommand = (pid) => {
  try {
    return execFileSync('ps', ['-p', String(pid), '-o', 'command='], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
  } catch (error) {
    return 'unbekannter Prozess'
  }
}

const waitUntilAvailable = async (port, timeoutMs) => {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    if (!getListeningPids(port).length && (await canListen(port))) {
      return true
    }

    await wait(150)
  }

  if (getListeningPids(port).length) {
    return false
  }

  return canListen(port)
}

const stopProcesses = async (pids, signal) => {
  pids.forEach((pid) => {
    try {
      process.kill(pid, signal)
    } catch (error) {
      if (error.code !== 'ESRCH') {
        console.warn(`Prozess ${pid} konnte nicht mit ${signal} beendet werden: ${error.message}`)
      }
    }
  })
}

const ensurePortAvailable = async (port) => {
  try {
    const pids = getListeningPids(port)

    if (!pids.length && (await canListen(port))) {
      return
    }

    if (!pids.length) {
      console.error(`Port ${port} ist belegt, aber der belegende Prozess konnte nicht ermittelt werden.`)
      process.exit(1)
    }

    const processList = pids.map((pid) => `${pid} (${getCommand(pid)})`).join(', ')
    console.log(`Port ${port} ist belegt; beende Prozess(e): ${processList}`)

    await stopProcesses(pids, 'SIGTERM')

    if (await waitUntilAvailable(port, gracefulTimeoutMs)) {
      console.log(`Port ${port} ist frei.`)
      return
    }

    const remainingPids = getListeningPids(port)

    if (remainingPids.length) {
      console.log(`Port ${port} ist noch belegt; erzwinge Beenden: ${remainingPids.join(', ')}`)
      await stopProcesses(remainingPids, 'SIGKILL')
    }

    if (await waitUntilAvailable(port, forceTimeoutMs)) {
      console.log(`Port ${port} ist frei.`)
      return
    }

    console.error(`Port ${port} konnte nicht freigegeben werden.`)
    process.exit(1)
  } catch (error) {
    console.error(`Port ${port} konnte nicht geprueft werden: ${error.message}`)
    process.exit(1)
  }
}

const ensurePortsAvailable = async () => {
  for (const port of ports) {
    await ensurePortAvailable(port)
  }
}

ensurePortsAvailable()
