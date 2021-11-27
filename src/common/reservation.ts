import dayjs, { Dayjs } from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
dayjs.extend(isSameOrBefore)

export interface Opponent {
  id: string
  name: string
}

export interface DateRange {
  start: dayjs.Dayjs
  end: dayjs.Dayjs
}

const RESERVATION_AVAILABLE_WITHIN_DAYS = 7

export class Reservation {
  public readonly dateRange: DateRange
  public readonly opponent: Opponent
  public readonly possibleDates: Dayjs[]
  public booked = false

  constructor(dateRange: DateRange, opponent: Opponent) {
    this.dateRange = dateRange
    this.opponent = opponent
    this.possibleDates = this.createPossibleDates()
  }

  private createPossibleDates(): Dayjs[] {
    const possibleDates: Dayjs[] = []

    const { start, end } = this.dateRange

    let possibleDate = dayjs(start)
    while (possibleDate.isSameOrBefore(end)) {
      possibleDates.push(possibleDate)
      possibleDate = possibleDate.add(15, 'minute')
    }

    return possibleDates
  }

  /**
   * Method to check if a reservation is available for reservation in the system
   * @returns is reservation date within 7 days
   */
  public isAvailableForReservation(): boolean {
    return Math.ceil(this.dateRange.start.diff(dayjs(), 'days', true)) <= RESERVATION_AVAILABLE_WITHIN_DAYS
  }
}
