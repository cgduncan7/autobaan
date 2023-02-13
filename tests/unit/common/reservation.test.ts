import { Dayjs } from 'dayjs'
import dayjs from '../../../src/common/dayjs'
import { DateRange, Reservation } from '../../../src/common/reservation'

describe('Reservation', () => {
  test('will create correct possible dates', () => {
    const startDate = dayjs().hour(12).minute(0).second(0).millisecond(0)
    const endDate = startDate.add(1, 'hour')
    const dateRange: DateRange = {
      start: startDate,
      end: endDate,
    }
    const res = new Reservation(
      { username: 'collin', password: 'password' },
      dateRange,
      {
        id: 'collin',
        name: 'collin',
      }
    )

    expect(res.possibleDates).toHaveLength(5)

    console.log(res.possibleDates[0].format())
    expect(res.possibleDates[0]).toEqual(startDate)
    expect(res.possibleDates[1]).toEqual(startDate.add(15, 'minute'))
    expect(res.possibleDates[2]).toEqual(startDate.add(30, 'minute'))
    expect(res.possibleDates[3]).toEqual(startDate.add(45, 'minute'))
    expect(res.possibleDates[4]).toEqual(startDate.add(60, 'minute'))
  })

  test.each([
    { reservationDate: dayjs().add(7, 'days'), expected: true },
    { reservationDate: dayjs().add(1, 'days'), expected: true },
    { reservationDate: dayjs().add(8, 'days').add(5, 'minutes'), expected: false },
  ])(
    'will properly mark reservation availability according to date',
    ({ reservationDate, expected }) => {
      const res = new Reservation(
        { username: 'collin', password: 'collin' },
        { start: reservationDate, end: reservationDate },
        { id: 'collin', name: 'collin' }
      )
      expect(res.isAvailableForReservation()).toBe(expected)
    }
  )

  const zeroTime = (date: Dayjs): Dayjs =>
    date.hour(0).minute(0).second(0).millisecond(0)

  test.each([
    {
      date: dayjs().add(8, 'days'),
      expected: zeroTime(dayjs().add(1, 'days')),
    },
    {
      date: dayjs().add(31, 'days'),
      expected: zeroTime(dayjs().add(24, 'days')),
    },
  ])(
    'should return value indicating if reservation is possible now',
    ({ date, expected }) => {
      const res = new Reservation(
        { username: 'collin', password: 'collin' },
        { start: date, end: date },
        { id: 'collin', name: 'collin' }
      )
      expect(res.getAllowedReservationDate()).toStrictEqual(expected)
    }
  )
})
