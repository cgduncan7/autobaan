import { InjectQueue } from '@nestjs/bull'
import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import dayjs from '../common/dayjs'
import { LoggerService } from '../logger/service.logger'
import { MONITORING_QUEUE_NAME, MonitoringQueue } from '../monitoring/config'
import { MonitorType } from '../monitoring/entity'
import { NtfyProvider } from '../ntfy/provider'
import { BaanReserverenService } from '../runner/baanreserveren/service'
import { RESERVATIONS_QUEUE_NAME, ReservationsQueue } from './config'
import { ReservationsService } from './service'

export const DAILY_RESERVATIONS_ATTEMPTS = 2

@Injectable()
export class ReservationsCronService {
	constructor(
		@Inject(ReservationsService)
		private readonly reservationService: ReservationsService,

		@Inject(BaanReserverenService)
		private readonly brService: BaanReserverenService,

		@InjectQueue(RESERVATIONS_QUEUE_NAME)
		private readonly reservationsQueue: ReservationsQueue,

		@Inject(NtfyProvider)
		private readonly ntfyProvider: NtfyProvider,

		@Inject(LoggerService)
		private readonly loggerService: LoggerService,
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_7AM, {
		name: 'handleDailyReservations',
		timeZone: 'Europe/Amsterdam',
	})
	async handleDailyReservations() {
		this.loggerService.log('handleDailyReservations beginning')
		await this.ntfyProvider.sendCronStartNotification('handleDailyReservations')
		const reservationsToPerform = await this.reservationService.getSchedulable()
		if (reservationsToPerform.length > 0) {
			this.loggerService.log(
				`Found ${reservationsToPerform.length} reservations to perform`,
			)
			await this.reservationsQueue.addBulk(
				reservationsToPerform.map((r) => ({
					data: r,
					opts: { attempts: DAILY_RESERVATIONS_ATTEMPTS },
				})),
			)
		} else {
			this.loggerService.log('Monitoring reservations')
			await this.brService.monitorCourtReservations(dayjs().add(7, 'day'))
		}
		this.loggerService.log('handleDailyReservations ending')
		await this.ntfyProvider.sendCronStopNotification(
			'handleDailyReservations',
			`Count: ${reservationsToPerform.length}`,
		)
	}

	@Cron(CronExpression.EVERY_DAY_AT_11PM, {
		name: 'cleanUpExpiredReservations',
		timeZone: 'Europe/Amsterdam',
	})
	async cleanUpExpiredReservations() {
		this.loggerService.log('cleanUpExpiredReservations beginning')
		await this.ntfyProvider.sendCronStartNotification(
			'cleanUpExpiredReservations',
		)
		const reservations = await this.reservationService.getByDate()
		this.loggerService.log(
			`Found ${reservations.length} reservations to delete`,
		)
		for (const reservation of reservations) {
			await this.reservationService.deleteById(reservation.id)
		}
		this.loggerService.log('cleanUpExpiredReservations ending')
		await this.ntfyProvider.sendCronStopNotification(
			'cleanUpExpiredReservations',
			`Count: ${reservations.length}`,
		)
	}
}
