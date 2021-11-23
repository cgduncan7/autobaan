import dayjs from 'dayjs'

import {
  validateRequest,
  ValidationError,
  ValidationErrorCode,
} from '../../src/common/request'

describe('request', () => {
  describe('validateRequest', () => {
    test('should return ReservationRequest', () => {
      const body = JSON.stringify({
        username: 'collin',
        password: '123abc',
        dateRanges: [
          { start: '2021-12-25T12:34:56Z', end: '2021-12-25T12:45:56Z' }
        ],
        opponent: {
          id: '123',
          name: 'collin',
        }
      })

      expect(() => validateRequest(body)).not.toThrow()
    })

    test('should fail for undefined body', () => {
      expect(() => validateRequest(undefined)).toThrowError(new ValidationError('Invalid request', ValidationErrorCode.UNDEFINED_REQUEST_BODY))
    })

    test.each([
      { username: '', password: '1qaz2wsx', dateRanges: [{ start: '1', end: '1' }], opponent: { id: '123', name: 'abc' } },
      { password: '1qaz2wsx', dateRanges: [{ start: '1', end: '1' }], opponent: { id: '123', name: 'abc' } },
      { username: 'collin', password: '', dateRanges: [{ start: '1', end: '1' }], opponent: { id: '123', name: 'abc' } },
      { username: 'collin', dateRanges: [{ start: '1', end: '1' }], opponent: { id: '123', name: 'abc' } },
      { username: 'collin', password: '1qaz2wsx', dateRanges: [], opponent: { id: '123', name: 'abc' } },
      { username: 'collin', password: '1qaz2wsx', opponent: { id: '123', name: 'abc' } },
      { username: 'collin', password: '1qaz2wsx', dateRanges: [{ start: '1', end: '1' }], opponent: { id: '', name: 'abc' } },
      { username: 'collin', password: '1qaz2wsx', dateRanges: [{ start: '1', end: '1' }], opponent: { name: 'abc' } },
      { username: 'collin', password: '1qaz2wsx', dateRanges: [{ start: '1', end: '1' }], opponent: { id: '123', name: '' } },
      { username: 'collin', password: '1qaz2wsx', dateRanges: [{ start: '1', end: '1' }], opponent: { id: '123' } },
    ])('should fail for body missing required values', (body) => {
      expect(() => validateRequest(JSON.stringify(body))).toThrowError(new ValidationError('Invalid request', ValidationErrorCode.INVALID_REQUEST_BODY))
    })

    test('should fail for invalid date range', () => {
      const body = JSON.stringify({
        username: 'collin',
        password: '123abc',
        dateRanges: [
          { start: 'monkey', end: '2021-12-25T12:45:56Z' }
        ],
        opponent: {
          id: '123',
          name: 'collin',
        }
      })

      expect(() => validateRequest(body)).toThrowError(new ValidationError('Invalid request', ValidationErrorCode.INVALID_DATE_RANGE))
    })

    test.each([
      { start: dayjs().subtract(1, 'hour').toString(), end: dayjs().add(1, 'hour').toString() },
      { start: dayjs().add(2, 'hour').toString(), end: dayjs().add(1, 'hour').toString() },
      { start: dayjs().toString(), end: dayjs().add(1, 'day').toString() }
    ])('should fail for improper start or end dates', (dateRange) => {
      const body = JSON.stringify({
        username: 'collin',
        password: '123abc',
        dateRanges: [
          dateRange
        ],
        opponent: {
          id: '123',
          name: 'collin',
        }
      })

      expect(() => validateRequest(body)).toThrowError(new ValidationError('Invalid request', ValidationErrorCode.INVALID_START_OR_END_DATE))
    })

    test('should not fail if no opponent is provided', () => {
      const body = JSON.stringify({
        username: 'collin',
        password: '123abc',
        dateRanges: [
          { start: '2021-12-25T12:34:56Z', end: '2021-12-25T12:45:56Z' }
        ],
      })

      expect(() => validateRequest(body)).not.toThrow()
    })

    test.each([
      { id: 123, name: 'collin' },
      { id: '', name: 'collin' },
      { id: '123', name: true },
      { id: '123', name: '' },
    ])('should fail for invalid opponent id', (opponent) => {
      const body = JSON.stringify({
        username: 'collin',
        password: '123abc',
        dateRanges: [
          { start: '2021-12-25T12:34:56Z', end: '2021-12-25T12:45:56Z' }
        ],
        opponent,
      })

      expect(() => validateRequest(body)).toThrowError(new ValidationError('Invalid request', ValidationErrorCode.INVALID_OPPONENT))
    })
  })
})