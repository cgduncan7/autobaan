import { InjectQueue } from '@nestjs/bull'
import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Queue } from 'bull'

import { LoggerService } from '../logger/service.logger'
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
		this.loggerService.log('handleDailyReservations beginning')
		const reservationsToPerform = await this.reservationService.getSchedulable()
		this.loggerService.log(
			`Found ${reservationsToPerform.length} reservations to perform`,
		)
		await this.reservationsQueue.addBulk(
			reservationsToPerform.map((r) => ({ data: r, opts: { attempts: 1 } })),
		)
		this.loggerService.log('handleDailyReservations ending')
	}

	@Cron(CronExpression.EVERY_DAY_AT_11PM, {
		name: 'cleanUpExpiredReservations',
		timeZone: 'Europe/Amsterdam',
	})
	async cleanUpExpiredReservations() {
		this.loggerService.log('cleanUpExpiredReservations beginning')
		const reservations = await this.reservationService.getByDate()
		this.loggerService.log(
			`Found ${reservations.length} reservations to delete`,
		)
		for (const reservation of reservations) {
			await this.reservationService.deleteById(reservation.id)
		}
		this.loggerService.log('cleanUpExpiredReservations ending')
	}
}
