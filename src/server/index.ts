import http from 'http'
import { Readable } from 'stream'
import { v4 } from 'uuid'
import { Logger, LogLevel } from '../common/logger'
import { work as schedule } from '../workers/scheduler'

Logger.instantiate('requester', 'start-up', LogLevel.INFO)

process.on('unhandledRejection', (reason) => {
  Logger.error('unhandled rejection', { reason })
})

process.on('uncaughtException', (error, origin) => {
  Logger.error('uncaught exception', { error, origin })
})

const parseJson = async <T extends Record<string, unknown>>(
  length: number,
  encoding: BufferEncoding,
  readable: Readable
) => {
  return new Promise<T>((res, rej) => {
    let jsonBuffer: Buffer
    try {
      jsonBuffer = Buffer.alloc(length, encoding)
      readable.setEncoding(encoding)
    } catch (error: any) {
      rej(error)
    }

    readable.on('data', (chunk) => {
      try {
        jsonBuffer.write(chunk, encoding)
      } catch (error: any) {
        rej(error)
      }
    })

    readable.on('end', () => {
      try {
        const jsonObject = JSON.parse(jsonBuffer.toString())
        res(jsonObject)
      } catch (error: any) {
        rej(error)
      }
    })
  })
}

// Handles POST requests to /reservations
const server = http.createServer(async (req, res) => {
  const { url, method } = req

  Logger.instantiate('requester', v4(), LogLevel.DEBUG)
  Logger.debug('Incoming request')

  if (
    !url ||
    !method ||
    !/^\/reservations$/.test(url) ||
    method.toLowerCase() !== 'post'
  ) {
    Logger.info('Bad request')
    res.writeHead(400, 'Bad request')
    res.end()
    return
  }

  try {
    const length = Number.parseInt(req.headers['content-length'] || '0')
    const encoding = req.readableEncoding || 'utf8'
    const json = await parseJson(length, encoding, req)
    await schedule(json)
  } catch (error: any) {
    Logger.error('Failed to parse body', { error })
    res.writeHead(400, 'Bad request')
    res.end()
    return
  }

  res.end()
})

const port = process.env.SERVER_PORT || 3000

server.listen(port, () => Logger.info('server ready and listening', { port }))
