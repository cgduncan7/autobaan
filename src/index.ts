import { connect, disconnect } from './common/database'
import { Logger } from './common/logger'
import server from './server'

process.on('unhandledRejection', (reason) => {
  Logger.error('unhandled rejection', { reason })
})

process.on('uncaughtException', (error, origin) => {
  Logger.error('uncaught exception', { error, origin })
})

process.on('beforeExit', async () => {
  await disconnect()
})

const port = process.env.SERVER_PORT || 3000

server.listen(port, async () => {
  Logger.info('server ready and listening', { port })
  await connect()
  Logger.info('database connection established')
})
