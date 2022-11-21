import dayjs, { Dayjs } from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { query } from './database'
dayjs.extend(isSameOrBefore)

const RESERVATION_AVAILABLE_WITHIN_DAYS = 7

export interface User {
  username: string
  password: string
}

export interface Opponent {
  id: string
  name: string
}

export interface DateRange {
  start: dayjs.Dayjs
  end: dayjs.Dayjs
}

export class Reservation {
  public readonly user: User
  public readonly dateRange: DateRange
  public readonly opponent: Opponent
  public readonly possibleDates: Dayjs[]
  public booked = false

  constructor(
    user: User,
    dateRange: DateRange,
    opponent: Opponent,
    possibleDates?: Dayjs[]
  ) {
    this.user = user
    this.dateRange = dateRange
    this.opponent = opponent
    this.possibleDates = possibleDates || this.createPossibleDates()
  }

  private createPossibleDates(): Dayjs[] {
    const possibleDates: Dayjs[] = []

    const { start, end } = this.dateRange

    let possibleDate = dayjs(start).second(0).millisecond(0)
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
    return (
      Math.ceil(this.dateRange.start.diff(dayjs(), 'days', true)) <=
      RESERVATION_AVAILABLE_WITHIN_DAYS
    )
  }

  public getAllowedReservationDate(): Dayjs {
    return this.dateRange.start
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0)
      .subtract(RESERVATION_AVAILABLE_WITHIN_DAYS, 'days')
  }

  public toString() {
    return JSON.stringify(this.format())
  }

  public format() {
    return {
      user: {
        username: this.user.username,
        password: this.user.password ? '?' : null,
      },
      opponent: this.opponent,
      booked: this.booked,
      possibleDates: this.possibleDates.map((date) => date.format()),
      dateRange: {
        start: this.dateRange.start.format(),
        end: this.dateRange.end.format(),
      },
    }
  }

  public serializeToJson(): SerializedReservation {
    return {
      user: this.user,
      opponent: this.opponent,
      booked: this.booked,
      possibleDates: this.possibleDates.map((date) => date.format()),
      dateRange: {
        start: this.dateRange.start.format(),
        end: this.dateRange.end.format(),
      },
    }
  }

  public static deserializeFromJson(
    serializedData: SerializedReservation
  ): Reservation {
    const start = dayjs(serializedData.dateRange.start)
    const end = dayjs(serializedData.dateRange.end)
    return new Reservation(
      serializedData.user,
      { start, end },
      serializedData.opponent,
      Reservation.deserializePossibleDates(serializedData.possibleDates)
    )
  }

  public static deserializePossibleDates(dates: string[]): Dayjs[] {
    return dates.map((date) => dayjs(date))
  }

  public static async save(res: Reservation) {
    await query(
      `
      INSERT INTO reservations
      (
        username,
        password,
        date_range_start,
        date_range_end,
        opponent_id,
        opponent_name
      )
      VALUES
      (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
      )
    `,
      [
        res.user.username,
        res.user.password,
        res.dateRange.start,
        res.dateRange.end,
        res.opponent.id,
        res.opponent.name,
      ]
    )
  }

  public static async fetch(id: number): Promise<Reservation | null> {
    const response = await query<SqlReservation>(
      `
      SELECT *
      FROM reservations
      WHERE id = ?
    `,
      [id]
    )

    if (response.results.length === 1) {
      const sqlReservation = response.results[0]
      const res = new Reservation(
        {
          username: sqlReservation.username,
          password: sqlReservation.password,
        },
        {
          start: dayjs(sqlReservation.date_range_start),
          end: dayjs(sqlReservation.date_range_end),
        },
        { id: sqlReservation.opponent_id, name: sqlReservation.opponent_name }
      )
      return res
    }

    return null
  }
}

export interface SerializedDateRange {
  start: string
  end: string
}

export interface SerializedReservation {
  user: User
  opponent: Opponent
  booked: boolean
  possibleDates: string[]
  dateRange: SerializedDateRange
}

export interface SqlReservation {
  username: string
  password: string
  date_range_start: string
  date_range_end: string
  opponent_id: string
  opponent_name: string
}
