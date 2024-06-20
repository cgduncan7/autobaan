import { InjectQueue } from '@nestjs/bull'
import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Dayjs } from 'dayjs'

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

	private async sleepUntil(time: Dayjs) {
		let keepSleeping = true

		while (keepSleeping) {
			const now = dayjs()
			keepSleeping = !time.isBefore(now)
			if (!keepSleeping) break
			await new Promise((res) => {
				setTimeout(() => res(null), 50)
			})
		}
	}

	@Cron('55 06 * * *', {
		name: 'handleDailyReservations',
		timeZone: 'Europe/Amsterdam',
	})
	async handleDailyReservations() {
		this.loggerService.debug('handleDailyReservations beginning')
		await this.ntfyProvider.sendCronStartNotification('handleDailyReservations')
		const reservationsToPerform = await this.reservationService.getSchedulable()
		if (reservationsToPerform.length > 0) {
			this.loggerService.debug(
				`Found ${reservationsToPerform.length} reservations to perform`,
			)

			// In order to make sure session is fresh and speed up some shit let's warm him up
			await this.brService.warmup()

			this.loggerService.debug(`Warmed up! Waiting for go-time`)

			await this.sleepUntil(
				dayjs()
					.set('hour', 7)
					.set('minute', 0)
					.set('second', 0)
					.set('millisecond', 0),
			)

			this.loggerService.debug(`It's go-time`)
			await this.reservationsQueue.addBulk(
				reservationsToPerform.map((res) => ({
					data: { reservation: res, speedyMode: true },
					opts: { attempts: DAILY_RESERVATIONS_ATTEMPTS },
				})),
			)
		} else {
			this.loggerService.debug('Monitoring reservations')
			await this.brService.monitorCourtReservations(dayjs().add(7, 'day'))
		}
		this.loggerService.debug('handleDailyReservations ending')
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
		this.loggerService.debug('cleanUpExpiredReservations beginning')
		await this.ntfyProvider.sendCronStartNotification(
			'cleanUpExpiredReservations',
		)
		const reservations = await this.reservationService.getByDate()
		this.loggerService.debug(
			`Found ${reservations.length} reservations to delete`,
		)
		for (const reservation of reservations) {
			await this.reservationService.deleteById(reservation.id)
		}
		this.loggerService.debug('cleanUpExpiredReservations ending')
		await this.ntfyProvider.sendCronStopNotification(
			'cleanUpExpiredReservations',
			`Count: ${reservations.length}`,
		)
	}
}
