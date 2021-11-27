import dayjs, { Dayjs } from 'dayjs'
import { scheduleDateToRequestReservation } from '../../src/common/schedule'

describe('scheduleDateToRequestReservation', () => {
  const zeroTime = (date: Dayjs): Dayjs => date.hour(0).minute(0).second(0).millisecond(0)

  test.each([
    { date: dayjs().add(8, 'days'), expected: zeroTime(dayjs().add(1, 'days')) },
    { date: dayjs().add(31, 'days'), expected: zeroTime(dayjs().add(24, 'days')) },
  ])('should return value indicating if reservation is possible now', ({ date, expected }) => {
    expect(scheduleDateToRequestReservation(date)).toStrictEqual(expected)
  })
})