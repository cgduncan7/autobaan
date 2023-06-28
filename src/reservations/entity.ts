import { Exclude, Transform, Type } from 'class-transformer'
import { Dayjs } from 'dayjs'
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'
import dayjs from '../common/dayjs'
import { TransformationType } from 'class-transformer'

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

	@Column('datetime', {
		nullable: false,
		transformer: {
			to: (value: Dayjs) => value.format(),
			from: (value: Date) => dayjs(value),
		},
	})
	@Type(() => Dayjs)
	@Transform(({ value, type }) => {
		switch (type) {
			case TransformationType.PLAIN_TO_CLASS:
				return dayjs(value)
			case TransformationType.CLASS_TO_PLAIN:
				return value.format()
			default:
				return value
		}
	})
	dateRangeStart: Dayjs

	@Column('datetime', {
		nullable: false,
		transformer: {
			to: (value: Dayjs) => value.format(),
			from: (value: Date) => dayjs(value),
		},
	})
	@Type(() => Dayjs)
	@Transform(({ value, type }) => {
		switch (type) {
			case TransformationType.PLAIN_TO_CLASS:
				return dayjs(value)
			case TransformationType.CLASS_TO_PLAIN:
				return value.format()
			default:
				return value
		}
	})
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
		return this.dateRangeStart.diff(dayjs(), 'day') <= 7
	}

	/**
	 * Get the date which a reservation can be made
	 * @returns the date from which a reservation is allowed to be made
	 */
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
