import dayjs from 'dayjs'
import { DateRange, Reservation } from '../../src/common/reservation'

describe("Reservation", () => {
  it("will create correct possible dates", () => {
    const startDate = dayjs().set("hour", 12).set("minute", 0)
    const endDate = dayjs().set("hour", 13).set("minute", 0)
    const dateRange: DateRange = {
      start: startDate,
      end: endDate,
    }
    const res = new Reservation(dateRange, { id: 'collin', name: 'collin' })
    
    expect(res.possibleDates).toHaveLength(5)

    expect(res.possibleDates[0]).toEqual(startDate)
    expect(res.possibleDates[1]).toEqual(startDate.add(15, "minute"))
    expect(res.possibleDates[2]).toEqual(startDate.add(30, "minute"))
    expect(res.possibleDates[3]).toEqual(startDate.add(45, "minute"))
    expect(res.possibleDates[4]).toEqual(startDate.add(60, "minute"))
  })
})