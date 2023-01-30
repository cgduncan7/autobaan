import dayjs from '../../../src/common/dayjs'
import {
  ValidationError,
  ValidationErrorCode,
} from '../../../src/common/request'
import { Reservation } from '../../../src/common/reservation'
import { schedule, SchedulerInput } from '../../../src/common/scheduler'
import * as database from '../../../src/common/database'

jest.mock('../../../src/common/logger')
jest.mock('../../../src/common/reserver')
jest.mock('uuid', () => ({ v4: () => '1234' }))
jest.useFakeTimers().setSystemTime(new Date('2022-01-01'))

describe('scheduler', () => {
  test('should handle valid requests within reservation window', async () => {
    jest.spyOn(database, 'run').mockResolvedValueOnce()
    const start = dayjs().add(15, 'minutes')
    const end = start.add(15, 'minutes')

    const payload: SchedulerInput = {
      username: 'collin',
      password: 'password',
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      opponent: { id: '123', name: 'collin' },
    }

    expect(await schedule(payload)).toMatchSnapshot({
      scheduledReservation: {
        reservation: {
          id: expect.any(String),
          user: {
            username: 'collin',
            password: expect.any(String),
          },
          dateRange: { start, end },
          opponent: { id: '123', name: 'collin' },
        },
      },
    })
  })

  test('should handle valid requests outside of reservation window', async () => {
    const start = dayjs().add(15, 'days')
    const end = start.add(15, 'minutes')
    const payload: SchedulerInput = {
      username: 'collin',
      password: 'password',
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      opponent: { id: '123', name: 'collin' },
    }

    await expect(await schedule(payload)).toMatchSnapshot({
      scheduledReservation: {
        reservation: new Reservation(
          { username: 'collin', password: expect.any(String) },
          { start, end },
          { id: '123', name: 'collin' },
          undefined,
          '1234'
        ),
        scheduledFor: start
          .subtract(7, 'days')
          .hour(0)
          .minute(0)
          .second(0)
          .millisecond(0),
      },
    })
  })

  test('should throw error for invalid requests', async () => {
    const start = dayjs().add(15, 'days')
    const end = start.add(15, 'minutes')

    const payload: SchedulerInput = {
      password: 'password',
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      opponent: { id: '123', name: 'collin' },
    }

    await expect(schedule(payload)).rejects.toThrowError(
      new ValidationError(
        'Invalid request',
        ValidationErrorCode.INVALID_REQUEST_BODY
      )
    )
  })
})
