import http from 'http'
import { v4 } from 'uuid'
import { asyncLocalStorage, Logger, LogLevel } from '../../common/logger'
import { CronRouter } from './routes/cron'
import { ReservationsRouter } from './routes/reservations'
import { RunnerRouter } from './routes/runner'

const cronRouter = new CronRouter()
const reservationsRouter = new ReservationsRouter()
const runnerRouter = new RunnerRouter()

// Handles POST requests to /reservations
const server = http.createServer(async (req, res) => {
  await asyncLocalStorage.run(
    new Logger('request', v4(), LogLevel.DEBUG),
    async () => {
      const logger = asyncLocalStorage.getStore()
      const { url, method } = req
      logger?.debug('Incoming request', { url, method })

      if (!url || !method) {
        logger?.info('Weird request', { url, method })
        res.writeHead(400, 'Bad request')
        res.end()
        return
      }

      switch (true) {
        case /^\/cron/.test(url): {
          await cronRouter.handleRequest(req, res)
          break
        }
        case /^\/reservations/.test(url): {
          await reservationsRouter.handleRequest(req, res)
          break
        }
        case /^\/runner/.test(url): {
          await runnerRouter.handleRequest(req, res)
          break
        }
        default: {
          logger?.info('Not found', { url, method, location: 'root' })
          res.writeHead(404, 'Not found')
        }
      }
      res.end()
    }
  )
})

export default server
