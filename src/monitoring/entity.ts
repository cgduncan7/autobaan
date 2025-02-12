import { Transform, Type } from 'class-transformer'
import { TransformationType } from 'class-transformer'
import { Dayjs } from 'dayjs'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

import dayjs from '../common/dayjs'

export enum MonitorType {
	CourtReservations = 'court_reservations',
}

@Entity({ name: 'monitors' })
export class Monitor {
	@PrimaryGeneratedColumn('uuid')
	id: string

	@Column('varchar', { length: 32, nullable: false })
	type: MonitorType

	@Column('datetime', {
		nullable: false,
		transformer: {
			to: (value?: Dayjs) => (value ?? dayjs()).format(),
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
	createdAt: Dayjs

	@Column('varchar', { nullable: false })
	data: string

	constructor(partial: Partial<Monitor>) {
		Object.assign(this, partial)
	}
}
