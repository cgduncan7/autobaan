import { InjectQueue } from '@nestjs/bull'
import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Queue } from 'bull'
import { RESERVATIONS_QUEUE_NAME } from './config'
import { ReservationsService } from './service'
import { LoggerService } from '../logger/service'

@Injectable()
export class ReservationsCronService {
	constructor(
		@Inject(ReservationsService)
		private readonly reservationService: ReservationsService,

		@InjectQueue(RESERVATIONS_QUEUE_NAME)
		private readonly reservationsQueue: Queue,

		@Inject(LoggerService)
		private readonly logger: LoggerService,
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_7AM, {
		name: 'handleDailyReservations',
		timeZone: 'Europe/Amsterdam',
	})
	async handleDailyReservations() {
		const reservationsToPerform = await this.reservationService.getByDate()
		this.logger.log(
			`Found ${reservationsToPerform.length} reservations to perform`,
		)
		await this.reservationsQueue.addBulk(
			reservationsToPerform.map((r) => ({ data: r })),
		)
	}
}
