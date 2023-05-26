import { Exclude, Transform, Type } from 'class-transformer'
import { Dayjs } from 'dayjs'
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'
import dayjs from '../common/dayjs'

@Entity({ name: 'reservations' })
export class Reservation {
	@PrimaryGeneratedColumn('uuid')
	id: string

	@Column('varchar', { length: 64, nullable: false })
	username: string

	@Transform(({ value, options: { groups = [] } }) =>
		groups.includes('password') ? value : '***',
	)
	@Column('varchar', { length: 255, nullable: false })
	password: string

	@Column('datetime', { nullable: false })
	@Type(() => Dayjs)
	@Transform(({ value }) => dayjs(value).format())
	dateRangeStart: Dayjs
	
	@Column('datetime', { nullable: false })
	@Type(() => Dayjs)
	@Transform(({ value }) => dayjs(value).format())
	dateRangeEnd: Dayjs

	@Column('varchar', { length: 32, nullable: false })
	opponentId: string

	@Column('varchar', { length: 255, nullable: false })
	opponentName: string

	constructor(partial: Partial<Reservation>) {
		Object.assign(this, partial)
	}

	@Exclude()
	public createPossibleDates(): Dayjs[] {
    const possibleDates: Dayjs[] = []

    let possibleDate = dayjs(this.dateRangeStart).second(0).millisecond(0)
    while (possibleDate.isSameOrBefore(this.dateRangeEnd)) {
      possibleDates.push(possibleDate)
      possibleDate = possibleDate.add(15, 'minute')
    }

    return possibleDates
  }

  /**
   * Method to check if a reservation is available for reservation in the system
   * @returns is reservation date within 7 days
   */
	@Exclude()
  public isAvailableForReservation(): boolean {
		return dayjs().diff(this.dateRangeStart, 'day') <= 7
  }

	@Exclude()
  public getAllowedReservationDate(): Dayjs {
		return this.dateRangeStart
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0)
      .subtract(7, 'days')
  }
}
