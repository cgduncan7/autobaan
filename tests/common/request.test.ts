import dayjs from 'dayjs'

import {
  validateJSONRequest,
  validateStringRequest,
  ValidationError,
  ValidationErrorCode,
} from '../../src/common/request'

describe('request', () => {

  const testDate = dayjs().add(1, 'day')

  describe('validateStringRequest', () => {
    test('should return ReservationRequest', () => {
      const body = JSON.stringify({
        username: 'collin',
        password: '123abc',
        dateRange: {
          start: testDate.clone().toISOString(),
          end: testDate.add(15, 'minutes').toISOString(),
        },
        opponent: {
          id: '123',
          name: 'collin',
        }
      })

      expect(() => validateStringRequest(body)).not.toThrow()
    })

    test('should fail for undefined body', () => {
      expect(() => validateStringRequest(undefined)).toThrowError(new ValidationError('Invalid request', ValidationErrorCode.UNDEFINED_REQUEST_BODY))
    })

    test('should fail for invalid json', () => {
      const body = `A{
        username: 'collin',
        password: '123abc',
        dateRange: {
          start: '2021-12-25T12:34:56Z',
          end: '2021-12-25T12:45:56Z'
        },
        opponent: {
          id: '123',
          name: 'collin',
        }
      }`

      expect(() => validateStringRequest(body)).toThrowError(new ValidationError('Invalid request', ValidationErrorCode.INVALID_JSON))
    })

    test.each([
      { username: '', password: '1qaz2wsx', dateRange: { start: '1', end: '1' }, opponent: { id: '123', name: 'abc' } },
      { password: '1qaz2wsx', dateRange: { start: '1', end: '1' }, opponent: { id: '123', name: 'abc' } },
      { username: 'collin', password: '', dateRange: { start: '1', end: '1' }, opponent: { id: '123', name: 'abc' } },
      { username: 'collin', dateRange: { start: '1', end: '1' }, opponent: { id: '123', name: 'abc' } },
      { username: 'collin', password: '1qaz2wsx', dateRange: {}, opponent: { id: '123', name: 'abc' } },
      { username: 'collin', password: '1qaz2wsx', dateRange: { start: '1' }, opponent: { id: '123', name: 'abc' } },
      { username: 'collin', password: '1qaz2wsx', dateRange: { end: '1' }, opponent: { id: '123', name: 'abc' } },
      { username: 'collin', password: '1qaz2wsx', opponent: { id: '123', name: 'abc' } },
      { username: 'collin', password: '1qaz2wsx', dateRange: { start: '1', end: '1' }, opponent: { id: '', name: 'abc' } },
      { username: 'collin', password: '1qaz2wsx', dateRange: { start: '1', end: '1' }, opponent: { name: 'abc' } },
      { username: 'collin', password: '1qaz2wsx', dateRange: { start: '1', end: '1' }, opponent: { id: '123', name: '' } },
      { username: 'collin', password: '1qaz2wsx', dateRange: { start: '1', end: '1' }, opponent: { id: '123' } },
    ])('should fail for body missing required values', (body) => {
      expect(() => validateStringRequest(JSON.stringify(body))).toThrowError(new ValidationError('Invalid request', ValidationErrorCode.INVALID_REQUEST_BODY))
    })

    test('should fail for invalid date range', () => {
      const body = JSON.stringify({
        username: 'collin',
        password: '123abc',
        dateRange: {
          start: 'monkey',
          end: testDate.add(15, 'minutes').toISOString(),
        },
        opponent: {
          id: '123',
          name: 'collin',
        }
      })

      expect(() => validateStringRequest(body)).toThrowError(new ValidationError('Invalid request', ValidationErrorCode.INVALID_DATE_RANGE))
    })

    test.each([
      { start: dayjs().subtract(1, 'hour').toString(), end: dayjs().add(1, 'hour').toString() },
      { start: dayjs().add(2, 'hour').toString(), end: dayjs().add(1, 'hour').toString() },
      { start: dayjs().toString(), end: dayjs().add(1, 'day').toString() }
    ])('should fail for improper start or end dates', (dateRange) => {
      const body = JSON.stringify({
        username: 'collin',
        password: '123abc',
        dateRange: [
          dateRange
        ],
        opponent: {
          id: '123',
          name: 'collin',
        }
      })

      expect(() => validateStringRequest(body)).toThrowError(new ValidationError('Invalid request', ValidationErrorCode.INVALID_START_OR_END_DATE))
    })

    test('should not fail if no opponent is provided', () => {
      const body = JSON.stringify({
        username: 'collin',
        password: '123abc',
        dateRange: {
          start: testDate.clone().toISOString(),
          end: testDate.add(15, 'minutes').toISOString()
        },
      })

      expect(() => validateStringRequest(body)).not.toThrow()
    })

    test.each([
      { id: '-50', name: 'collin' },
      { id: 'abc', name: 'collin' },
      { id: '-1', name: '*!@#' },
      { id: '123', name: '!@#' },
    ])('should fail for invalid opponent $id, $name', (opponent) => {
      const body = JSON.stringify({
        username: 'collin',
        password: '123abc',
        dateRange: {
          start: testDate.clone().toISOString(),
          end: testDate.add(15, 'minutes').toISOString(),
        },
        opponent,
      })

      expect(() => validateStringRequest(body)).toThrowError(new ValidationError('Invalid request', ValidationErrorCode.INVALID_OPPONENT))
    })
  })

  describe('validateJSONRequest', () => {
    test('should return ReservationRequest', () => {
      const body = {
        username: 'collin',
        password: '123abc',
        dateRange: {
          start: testDate.clone().toISOString(),
          end: testDate.add(15, 'minutes').toISOString()
        },
        opponent: {
          id: '123',
          name: 'collin',
        }
      }

      expect(() => validateJSONRequest(body)).not.toThrow()
    })
  })
})