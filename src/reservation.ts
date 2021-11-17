export interface Time {
  hour: number
  minute: number
}

export interface Opponent {
  id: string
  name: string
}

export interface DateTime {
  year: number
  month: number
  day: number
  timeRange: {
    start: Time
    end: Time
  }
}

export const timeToString = ({ hour, minute }: Time): string =>
  `${`${hour}`.padStart(2, '0')}:${`${minute}`.padStart(2, '0')}`

export class Reservation {
  public readonly dateTime: DateTime
  public readonly opponent: Opponent
  public readonly possibleTimes: Time[]
  public booked = false

  constructor(dateTime: DateTime, opponent: Opponent) {
    this.dateTime = dateTime
    this.opponent = opponent
    this.possibleTimes = this.createPossibleTimes()
  }

  private createPossibleTimes() {
    const possibleTimes: Time[] = []

    const { start, end } = this.dateTime.timeRange

    let { hour, minute } = start
    const { hour: endHour, minute: endMinute } = end

    while (hour <= endHour && minute <= endMinute) {
      possibleTimes.push({ hour, minute })
      minute = (minute + 15) % 60
      if (minute === 0) {
        hour++
      }
    }

    return possibleTimes
  }
}
