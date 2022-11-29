import http from 'http'
import { v4 } from 'uuid'
import { Logger, LogLevel } from '../common/logger'
import { schedule } from '../common/scheduler'
import { parseJson } from './utils'

// Handles POST requests to /reservations
const server = http.createServer(async (req, res) => {
  const { url, method } = req

  Logger.instantiate('request', v4(), LogLevel.DEBUG)
  Logger.debug('Incoming request')

  if (
    !url ||
    !method ||
    !/^\/reservations$/.test(url) ||
    method.toLowerCase() !== 'post'
  ) {
    Logger.info('Not found')
    res.writeHead(404, 'Not found')
    res.end()
    return
  }

  let jsonBody: Record<string, unknown>
  const contentType = req.headers['content-type'] || 'application/json'
  if (contentType !== 'application/json') {
    Logger.error('Invalid content type', { contentType })
    res.writeHead(406, 'Unsupported content type')
    res.end()
    return
  }

  try {
    const length = Number.parseInt(req.headers['content-length'] || '0')
    const encoding = req.readableEncoding || 'utf8'
    jsonBody = await parseJson(length, encoding, req)
  } catch (error: any) {
    Logger.error('Failed to parse body', { error: error.message })
    res.writeHead(400, 'Bad request')
    res.end()
    return
  }

  try {
    await schedule(jsonBody)
  } catch (error: any) {
    Logger.error('Failed to schedule request', { error })
    res.writeHead(400, 'Bad request')
    res.end()
    return
  }

  res.end()
})

export default server
