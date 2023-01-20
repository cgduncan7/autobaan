import { schedule, ScheduledTask, ScheduleOptions } from 'node-cron'
import { v4 } from 'uuid'
import { asyncLocalStorage, Logger, LogLevel } from '../common/logger'
import { reserve } from '../common/reserver'

const tasks: ScheduledTask[] = []

const getTaskConfig = (name: string): ScheduleOptions => ({
  name,
  recoverMissedExecutions: false,
  timezone: 'Europe/Amsterdam',
})

const logger = new Logger('cron', 'default', LogLevel.DEBUG)

export const startTasks = () => {
  try {
    const task = schedule(
      '0 * * * * *',
      async (timestamp) => {
        asyncLocalStorage.run(
          new Logger('cron', v4(), LogLevel.DEBUG),
          async () => {
            const childLogger = asyncLocalStorage.getStore()
            childLogger?.info('Running cron job', { timestamp })
            try {
              await reserve()
              childLogger?.info('Completed running cron job')
            } catch (error: any) {
              childLogger?.error('Error running cron job', {
                error: error.message,
              })
            }
          }
        )
      },
      getTaskConfig('reserver cron')
    )
    logger.debug('Started cron task')
    tasks.push(task)
  } catch (error: any) {
    logger.error('Failed to start tasks', { error: error.message })
  }
}

export const stopTasks = () => {
  try {
    tasks.map((task) => task.stop())
    logger.debug('Stopped cron tasks')
  } catch (error: any) {
    logger.error('Failed to stop tasks', { error: error.message })
  }
}
