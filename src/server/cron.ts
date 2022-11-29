import { schedule, ScheduledTask, ScheduleOptions } from 'node-cron'
import { Logger } from '../common/logger'
import { reserve } from '../common/reserver'

const tasks: ScheduledTask[] = []

const getTaskConfig = (name: string): ScheduleOptions => ({
  name,
  recoverMissedExecutions: false,
  timezone: 'Europe/Amsterdam',
})

export const startTasks = () => {
  try {
    const task = schedule(
      '0 * * * * *',
      async (timestamp) => {
        Logger.info('Running cron job', { timestamp })
        try {
          await reserve()
          Logger.info('Completed running cron job')
        } catch (error: any) {
          Logger.error('Error running cron job', { error: error.message })
        }
      },
      getTaskConfig('reserver cron')
    )
    Logger.debug('Started cron task')
    tasks.push(task)
  } catch (error: any) {
    Logger.error('Failed to start tasks', { error: error.message })
  }
}

export const stopTasks = () => {
  try {
    tasks.map((task) => task.stop())
    Logger.debug('Stopped cron tasks')
  } catch (error: any) {
    Logger.error('Failed to stop tasks', { error: error.message })
  }
}
