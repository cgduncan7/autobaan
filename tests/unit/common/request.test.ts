import dayjs from '../../../src/common/dayjs'

import {
  validateJSONRequest,
  ValidationError,
} from '../../../src/common/request'

describe('request', () => {
  const testDate = dayjs().add(1, 'day')

  describe('validateJSONRequest', () => {
    test('should return ReservationRequest', async () => {
      const body = {
        username: 'collin',
        password: '123abc',
        dateRange: {
          start: testDate.clone().toISOString(),
          end: testDate.add(15, 'minutes').toISOString(),
        },
        opponent: {
          id: '123',
          name: 'collin',
        },
      }

      const res = await validateJSONRequest(body)
      expect(res).toBeDefined()
      expect(res.dateRange.start.format()).toEqual(testDate.format())
    })

    test('should throw error for undefined body', async () => {
      // @ts-expect-error undefined body
      expect(() => validateJSONRequest(undefined)).rejects.toThrowError(
        ValidationError
      )
    })

    test('should throw error for invalid body', () => {
      expect(() =>
        validateJSONRequest({ username: '', password: '' })
      ).rejects.toThrowError(ValidationError)
    })

    test('should throw error for invalid date range', () => {
      expect(() =>
        validateJSONRequest({
          username: 'test',
          password: 'test',
          dateRange: { start: 'a', end: 'a' },
          opponent: { id: 1, name: 'test' },
        })
      ).rejects.toThrowError(ValidationError)
    })

    test('should throw error for incorrect date range', () => {
      expect(() =>
        validateJSONRequest({
          username: 'test',
          password: 'test',
          dateRange: { start: '2022-01-01', end: '2021-01-01' },
          opponent: { id: 1, name: 'test' },
        })
      ).rejects.toThrowError(ValidationError)
    })

    test('should throw error for incorrect date range', () => {
      expect(() =>
        validateJSONRequest({
          username: 'test',
          password: 'test',
          dateRange: {
            start: testDate.toString(),
            end: testDate.add(15, 'minute').toString(),
          },
          opponent: { id: 1, name: 'test' },
        })
      ).rejects.toThrowError(ValidationError)
    })
  })
})
