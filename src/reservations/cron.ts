import { InjectQueue } from '@nestjs/bull'
import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import dayjs from '../common/dayjs'
import { LoggerService } from '../logger/service.logger'
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

	@Cron('55 06 * * *', {
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

			// In order to make sure session is fresh and speed up some shit let's warm him up
			await this.brService.warmup()

			this.loggerService.log(`Warmed up! Waiting for go-time`)

			let not7AM = true
			const waitTime = 10
			const time7AM = dayjs()
				.set('hour', 7)
				.set('minute', 0)
				.set('second', 0)
				.set('millisecond', 0)

			while (not7AM) {
				not7AM = time7AM.isBefore(dayjs()) && time7AM.diff(dayjs()) >= waitTime // current time is more than 100ms from 7am
				if (!not7AM) break
				await new Promise((res) => setTimeout(res, waitTime)) // wait for waitTime and then try again
			}

			this.loggerService.log(`It's go-time`)

			for (const res of reservationsToPerform) {
				await this.brService.performReservation(res).catch(
					async () =>
						await this.reservationsQueue.add(res, {
							attempts: Math.max(DAILY_RESERVATIONS_ATTEMPTS - 1, 1),
						}),
				)
			}
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
