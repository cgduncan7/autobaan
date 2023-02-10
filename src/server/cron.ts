import {
  schedule,
  ScheduledTask,
  ScheduleOptions,
  getTasks as getCronTasks,
} from 'node-cron'
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

export const getStatus = () => {
  const tasks = getCronTasks()
  if (tasks.get('reserver cron')) {
    return true
  }

  return false
}

export const startTasks = () => {
  try {
    if (tasks.length === 0) {
      const task = schedule(
        '0 7 * * *',
        async (timestamp) => {
          asyncLocalStorage.run(
            new Logger('cron', v4(), LogLevel.DEBUG),
            async () => {
              const childLogger = asyncLocalStorage.getStore()
              childLogger?.info('Running cron job', { timestamp })
              try {
                const result = await reserve()
                if (!result) {
                  throw new Error('Failed to complete reservation')
                }
                childLogger?.info('Completed running cron job')
              } catch (error) {
                childLogger?.error('Error running cron job', {
                  error: (error as Error).message,
                })
                stopTasks()
              }
            }
          )
        },
        getTaskConfig('reserver cron')
      )
      logger.debug('Started cron task')
      tasks.push(task)
    }
  } catch (error) {
    logger.error('Failed to start tasks', { error: (error as Error).message })
  }
}

export const stopTasks = () => {
  try {
    if (tasks.length > 0) {
      tasks.map((task) => task.stop())
      logger.debug('Stopped cron tasks')
    }
  } catch (error) {
    logger.error('Failed to stop tasks', { error: (error as Error).message })
  }
}
