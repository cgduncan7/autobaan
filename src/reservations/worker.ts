import { Process, Processor } from '@nestjs/bull'
import { Inject } from '@nestjs/common'
import { Job } from 'bull'
import { instanceToPlain, plainToInstance } from 'class-transformer'

import { LoggerService } from '../logger/service.logger'
import { NtfyProvider } from '../ntfy/provider'
import {
	BaanReserverenService,
	NoCourtAvailableError,
} from '../runner/baanreserveren/service'
import { RESERVATIONS_QUEUE_NAME, ReservationsJob } from './config'
import { DAILY_RESERVATIONS_ATTEMPTS } from './cron'
import { Reservation } from './entity'
import { ReservationsService } from './service'

@Processor(RESERVATIONS_QUEUE_NAME)
export class ReservationsWorker {
	constructor(
		@Inject(BaanReserverenService)
		private readonly brService: BaanReserverenService,

		@Inject(ReservationsService)
		private readonly reservationsService: ReservationsService,

		@Inject(LoggerService)
		private readonly loggerService: LoggerService,

		@Inject(NtfyProvider)
		private readonly ntfyProvider: NtfyProvider,
	) {}

	@Process()
	async handleReservationJob(job: ReservationsJob) {
		const reservation = plainToInstance(Reservation, job.data.reservation)
		this.loggerService.log('Handling reservation', {
			reservation: instanceToPlain(reservation),
		})
		await this.ntfyProvider.sendPerformingReservationNotification(
			reservation.id,
			reservation.dateRangeStart,
			reservation.dateRangeEnd,
		)
		await this.performReservation(
			reservation,
			job.attemptsMade,
			true,
			job.data.speedyMode,
		)
	}

	private async handleReservationErrors(
		error: Error,
		reservation: Reservation,
		attemptsMade: number,
		timeSensitive = true,
	) {
		const shouldWaitlist = error instanceof NoCourtAvailableError
		if (shouldWaitlist) {
			this.loggerService.warn('No court available')
		} else {
			this.loggerService.error('Error while performing reservation', error)
		}
		if (
			(shouldWaitlist || attemptsMade === DAILY_RESERVATIONS_ATTEMPTS) &&
			!reservation.waitListed
		) {
			this.loggerService.log('Adding reservation to waiting list')
			await this.ntfyProvider.sendReservationWaitlistedNotification(
				reservation.id,
				reservation.dateRangeStart,
				reservation.dateRangeEnd,
			)
			await this.addReservationToWaitList(reservation, timeSensitive)
		} else {
			throw error
		}
	}

	async performReservation(
		reservation: Reservation,
		attemptsMade: number,
		timeSensitive = true,
		speedyMode = true,
	) {
		try {
			if (speedyMode) {
				await this.brService.performSpeedyReservation(reservation)
			} else {
				await this.brService.performReservation(reservation, timeSensitive)
			}
			await this.reservationsService.deleteById(reservation.id)
		} catch (error: unknown) {
			await this.handleReservationErrors(
				error as Error,
				reservation,
				attemptsMade,
				timeSensitive,
			)
		}
	}

	async addReservationToWaitList(
		reservation: Reservation,
		timeSensitive = true,
	) {
		try {
			const waitingListId = await this.brService.addReservationToWaitList(
				reservation,
				timeSensitive,
			)
			await this.reservationsService.update(reservation.id, {
				waitListed: true,
				waitingListId,
			})
		} catch (error: unknown) {
			this.loggerService.error(
				'Error adding reservation to waiting list',
				error,
			)
		}
	}
}
