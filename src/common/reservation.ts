import { Dayjs } from 'dayjs'
import { v4 } from 'uuid'
import dayjs from './dayjs'
import { all, run } from './database'

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
  start: Dayjs
  end: Dayjs
}

export class Reservation {
  public readonly id: string
  public readonly user: User
  public readonly dateRange: DateRange
  public readonly opponent: Opponent
  public readonly possibleDates: Dayjs[]
  public booked = false

  constructor(
    user: User,
    dateRange: DateRange,
    opponent: Opponent,
    possibleDates?: Dayjs[],
    id = v4()
  ) {
    this.id = id
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

  public toString(obfuscate = false) {
    return JSON.stringify(this.format(obfuscate))
  }

  public format(obfuscate = false) {
    return {
      id: this.id,
      user: {
        username: this.user.username,
        password: obfuscate ? '???' : this.user.password,
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
      id: this.id,
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

  public async save() {
    await run(
      `
      INSERT INTO reservations
      (
        id,
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
        ?,
        ?
      )
    `,
      [
        this.id,
        this.user.username,
        this.user.password,
        this.dateRange.start.format('YYYY-MM-DD HH:mm:ss'),
        this.dateRange.end.format('YYYY-MM-DD HH:mm:ss'),
        this.opponent.id,
        this.opponent.name,
      ]
    )
  }

  public async delete() {
    await run(
      `
      DELETE FROM reservations
      WHERE id = ?
    `,
      [this.id]
    )
  }

  public static async deleteById(id: string) {
    await run(
      `
      DELETE FROM reservations
      WHERE id = ?
    `,
      [id]
    )
  }

  public static async fetchById(id: string): Promise<Reservation | null> {
    const response = await all<SqlReservation>(
      `
      SELECT *
      FROM reservations
      WHERE id = ?;
    `,
      [id]
    )

    if (response.length === 1) {
      const sqlReservation = response[0]
      const res = new Reservation(
        {
          username: sqlReservation.username,
          password: sqlReservation.password,
        },
        {
          start: dayjs(sqlReservation.date_range_start),
          end: dayjs(sqlReservation.date_range_end),
        },
        { id: sqlReservation.opponent_id, name: sqlReservation.opponent_name },
        undefined,
        sqlReservation.id
      )
      return res
    }

    return null
  }

  public static async fetchFirst(): Promise<Reservation | null> {
    const response = await all<SqlReservation>(
      `
      SELECT *
      FROM reservations
      ORDER BY date_range_start ASC
      LIMIT 1;
      `
    )

    if (response.length === 1) {
      const sqlReservation = response[0]
      const res = new Reservation(
        {
          username: sqlReservation.username,
          password: sqlReservation.password,
        },
        {
          start: dayjs(sqlReservation.date_range_start),
          end: dayjs(sqlReservation.date_range_end),
        },
        { id: sqlReservation.opponent_id, name: sqlReservation.opponent_name },
        undefined,
        sqlReservation.id
      )
      return res
    }

    return null
  }

  public static async fetchByDate(
    date: Dayjs,
    limit = 20
  ): Promise<Reservation[]> {
    const response = await all<SqlReservation>(
      `
      SELECT *
      FROM reservations
      WHERE DATE(date_range_start, '-7 day') = ?
      ORDER BY date_range_start ASC
      LIMIT ?;
      `,
      [date.format('YYYY-MM-DD'), limit]
    )

    if (response.length > 0) {
      return response.map(
        (sqlReservation) =>
          new Reservation(
            {
              username: sqlReservation.username,
              password: sqlReservation.password,
            },
            {
              start: dayjs(sqlReservation.date_range_start),
              end: dayjs(sqlReservation.date_range_end),
            },
            {
              id: sqlReservation.opponent_id,
              name: sqlReservation.opponent_name,
            },
            undefined,
            sqlReservation.id
          )
      )
    }

    return []
  }

  public static async fetchByPage(
    pageNumber: number,
    pageSize = 50
  ): Promise<Reservation[]> {
    const response = await all<SqlReservation>(
      `
      SELECT *
      FROM reservations
      ORDER BY date_range_start ASC
      LIMIT ?
      OFFSET ?;
      `,
      [pageSize, pageSize * pageNumber]
    )

    if (response.length > 0) {
      return response.map(
        (sqlReservation) =>
          new Reservation(
            {
              username: sqlReservation.username,
              password: sqlReservation.password,
            },
            {
              start: dayjs(sqlReservation.date_range_start),
              end: dayjs(sqlReservation.date_range_end),
            },
            {
              id: sqlReservation.opponent_id,
              name: sqlReservation.opponent_name,
            },
            undefined,
            sqlReservation.id
          )
      )
    }

    return []
  }
}

export interface SerializedDateRange {
  start: string
  end: string
}

export interface SerializedReservation {
  id: string
  user: User
  opponent: Opponent
  booked: boolean
  possibleDates: string[]
  dateRange: SerializedDateRange
}

export interface SqlReservation {
  id: string
  username: string
  password: string
  date_range_start: string
  date_range_end: string
  opponent_id: string
  opponent_name: string
}
