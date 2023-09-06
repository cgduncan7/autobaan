import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import dayjs from '../common/dayjs'
import { LoggerService } from '../logger/service.logger'
import { NtfyProvider } from '../ntfy/provider'
import { RecurringReservationsService } from './service'

@Injectable()
export class RecurringReservationsCronService {
	constructor(
		@Inject(RecurringReservationsService)
		private readonly recurringReservationsService: RecurringReservationsService,

		@Inject(LoggerService)
		private readonly loggerService: LoggerService,

		@Inject(NtfyProvider)
		private readonly ntfyProvider: NtfyProvider,
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_4AM, {
		name: 'handleRecurringReservations',
		timeZone: 'Europe/Amsterdam',
	})
	async handleRecurringReservations() {
		this.loggerService.log('handleRecurringReservations beginning')
		await this.ntfyProvider.sendCronStartNotification(
			'handleRecurringReservations',
		)
		const dayOfWeek = dayjs().get('day')
		const recurringReservationsToSchedule =
			await this.recurringReservationsService.getByDayOfWeek(dayOfWeek)
		this.loggerService.log(
			`Found ${recurringReservationsToSchedule.length} recurring reservations to schedule`,
		)
		for (const recurringReservation of recurringReservationsToSchedule) {
			await this.recurringReservationsService.scheduleReservation(
				recurringReservation,
			)
		}
		this.loggerService.log('handleRecurringReservations ending')
		await this.ntfyProvider.sendCronStopNotification(
			'handleRecurringReservations',
			`Count: ${recurringReservationsToSchedule.length}`,
		)
	}
}
