import { Exclude } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

import dayjs from '../common/dayjs'
import { Opponent, Reservation } from '../reservations/entity'

export enum DayOfWeek {
	Monday = 1,
	Tuesday = 2,
	Wednesday = 3,
	Thursday = 4,
	Friday = 5,
	Saturday = 6,
	Sunday = 7,
}

@Entity({ name: 'recurring_reservations' })
export class RecurringReservation {
	@PrimaryGeneratedColumn('uuid')
	id: string

	@Column('varchar', { length: 32, nullable: false })
	ownerId: string

	@Column('int', { nullable: false })
	@IsEnum(DayOfWeek)
	dayOfWeek: DayOfWeek

	@Column('varchar', { length: 6, nullable: false })
	timeStart: string

	@Column('varchar', { length: 6, nullable: false })
	timeEnd: string

	@Column('json', { nullable: false })
	opponents: Opponent[]

	constructor(partial: Partial<RecurringReservation>) {
		Object.assign(this, partial)
	}

	@Exclude()
	public createReservationInAdvance(daysInAdvance = 7): Reservation {
		const [hourStart, minuteStart] = this.timeStart.split(':')
		const [hourEnd, minuteEnd] = this.timeEnd.split(':')
		const dateRangeStart = dayjs()
			.set('day', this.dayOfWeek)
			.set('hour', Number.parseInt(hourStart))
			.set('minute', Number.parseInt(minuteStart))
			.add(daysInAdvance, 'days')
			.tz('Europe/Amsterdam', true)
		const dateRangeEnd = dayjs()
			.set('day', this.dayOfWeek)
			.set('hour', Number.parseInt(hourEnd))
			.set('minute', Number.parseInt(minuteEnd))
			.add(daysInAdvance, 'days')
			.tz('Europe/Amsterdam', true)
		const reservation = new Reservation({
			ownerId: this.ownerId,
			dateRangeStart: dateRangeStart,
			dateRangeEnd: dateRangeEnd,
			opponents: this.opponents,
		})
		return reservation
	}
}
