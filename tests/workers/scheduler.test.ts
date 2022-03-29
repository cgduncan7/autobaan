import dayjs from 'dayjs'
import { ValidationError, ValidationErrorCode } from '../../src/common/request'
import { work, SchedulerInput, SchedulerResult } from '../../src/workers/scheduler'

jest.mock('../../src/common/logger')

describe('scheduler', () => {
  test('should handle valid requests within reservation window', async () => {
    const start = dayjs().add(15, 'minutes')
    const end = start.add(15, 'minutes')

    const payload: SchedulerInput = {
      username: "collin",
      password: "password",
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      opponent: { id: "123", name: "collin" }
    }

    await expect(work(payload)).resolves
      .toMatchObject<SchedulerResult>({
        scheduledReservationRequest: {
          reservationRequest: {
            username: 'collin',
            password: 'password',
            dateRange: { start, end },
            opponent: { id: '123', name: 'collin' },
          }
        }})
  })

  test('should handle valid requests outside of reservation window', async () => {
    const start = dayjs().add(15, 'days')
    const end = start.add(15, 'minutes')
    const payload: SchedulerInput = {
      username: "collin",
      password: "password",
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      opponent: { id: "123", name: "collin" }
    }

    await expect(work(payload)).resolves.toMatchObject<SchedulerResult>({
      scheduledReservationRequest: {
        reservationRequest: {
          username: 'collin',
          password: 'password',
          dateRange: { start, end },
          opponent: { id: '123', name: 'collin' },
        },
        scheduledFor: start.subtract(7, 'days').hour(0).minute(0).second(0).millisecond(0)
      }
    })
  })

  test('should throw error for invalid requests', async () => {
    const start = dayjs().add(15, 'days')
    const end = start.add(15, 'minutes')

    const payload: SchedulerInput = {
      password: "password",
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      opponent: { id: "123", name: "collin" }
    }

    await expect(work(payload))
      .rejects
      .toThrowError(new ValidationError('Invalid request', ValidationErrorCode.INVALID_REQUEST_BODY))
  })
})