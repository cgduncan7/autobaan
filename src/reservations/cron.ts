import { InjectQueue } from '@nestjs/bull'
import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Queue } from 'bull'

import dayjs from '../common/dayjs'
import { LoggerService } from '../logger/service'
import { RESERVATIONS_QUEUE_NAME } from './config'
import { ReservationsService } from './service'

@Injectable()
export class ReservationsCronService {
	constructor(
		@Inject(ReservationsService)
		private readonly reservationService: ReservationsService,

		@InjectQueue(RESERVATIONS_QUEUE_NAME)
		private readonly reservationsQueue: Queue,

		@Inject(LoggerService)
		private readonly loggerService: LoggerService,
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_7AM, {
		name: 'handleDailyReservations',
		timeZone: 'Europe/Amsterdam',
	})
	async handleDailyReservations() {
		const reservationsToPerform = await this.reservationService.getByDate(
			dayjs().subtract(7, 'days'),
		)
		this.loggerService.log(
			`Found ${reservationsToPerform.length} reservations to perform`,
		)
		await this.reservationsQueue.addBulk(
			reservationsToPerform.map((r) => ({ data: r })),
		)
	}

	@Cron(CronExpression.EVERY_DAY_AT_11PM, {
		name: 'cleanUpExpiredReservations',
		timeZone: 'Europe/Amsterdam',
	})
	async cleanUpExpiredReservations() {
		const reservations = await this.reservationService.getByDate()
		this.loggerService.log(
			`Found ${reservations.length} reservations to delete`,
		)
		for (const reservation of reservations) {
			await this.reservationService.deleteById(reservation.id)
		}
	}
}
