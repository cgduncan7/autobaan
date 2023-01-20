import { disconnect, init } from '../common/database'
import { Logger, LogLevel } from '../common/logger'
import server from './http'
import { startTasks, stopTasks } from './cron'

const logger = new Logger('process', 'default', LogLevel.DEBUG)

process.on('unhandledRejection', (reason) => {
  logger.error('unhandled rejection', { reason })
})

process.on('uncaughtException', (error, origin) => {
  logger.error('uncaught exception', { error, origin })
})

process.on('beforeExit', async () => {
  await disconnect()
  stopTasks()
})

const port = process.env.SERVER_PORT || 3000

startTasks()

server.listen(port, async () => {
  logger.info('server ready and listening', { port })
  await init()
  logger.info('database connection established')
})
