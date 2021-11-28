import dayjs from 'dayjs'
import { ValidationError, ValidationErrorCode } from '../../src/common/request'
import handler, { ReservationSchedulerResult } from '../../src/lambdas/reservationScheduler'

jest.mock('../../src/common/logger')

describe('reservationScheduler', () => {
  test('should handle valid requests within reservation window', async () => {
    const start = dayjs().add(15, 'minutes')
    const end = start.add(15, 'minutes')

    const payload = '{' + 
      '"username": "collin",' + 
      '"password": "password",' + 
      `"dateRange": { "start": "${start.toISOString()}", "end": "${end.toISOString()}" },` +
      '"opponent": { "id": "123", "name": "collin" }' + 
    '}'

    // @ts-expect-error - Stubbing AWS context
    await expect(handler(payload, { awsRequestId: '1234' }, undefined)).resolves
      .toMatchObject<ReservationSchedulerResult>({
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
    const payload = '{' + 
      '"username": "collin",' + 
      '"password": "password",' + 
      `"dateRange": { "start": "${start.toISOString()}", "end": "${end.toISOString()}" },` +
      '"opponent": { "id": "123", "name": "collin" }' + 
    '}'

    // @ts-expect-error - Stubbing AWS context
    await expect(handler(payload, { awsRequestId: '1234' }, undefined)).resolves.toMatchObject<ReservationSchedulerResult>({
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
    const payload = '{invalidJson' + 
      '"username": "collin",' + 
      '"password": "password",' + 
      `"dateRange": { "start": "${start.format()}", "end": "${end.format()}" },` +
      '"opponent": { "id": "123", "name": "collin" }' + 
    '}'

    // @ts-expect-error - Stubbing AWS context
    await expect(handler(payload, { awsRequestId: '1234' }, undefined))
      .rejects
      .toThrowError(new ValidationError('Invalid request', ValidationErrorCode.INVALID_JSON))
  })
})