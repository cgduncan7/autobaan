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
import { RESERVATIONS_QUEUE_NAME } from './config'
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
	async handleReservationJob(job: Job<Reservation>) {
		const reservation = plainToInstance(Reservation, job.data, {
			groups: ['password'],
		})
		this.loggerService.log('Handling reservation', {
			reservation: instanceToPlain(reservation),
		})
		await this.ntfyProvider.sendPerformingReservationNotification(
			reservation.id,
			reservation.dateRangeStart,
			reservation.dateRangeEnd,
		)
		await this.performReservation(reservation)
	}

	private async handleReservationErrors(
		error: Error,
		reservation: Reservation,
	) {
		switch (true) {
			case error instanceof NoCourtAvailableError: {
				this.loggerService.warn('No court available')
				if (!reservation.waitListed) {
					this.loggerService.log('Adding reservation to waiting list')
					await this.ntfyProvider.sendReservationWaitlistedNotification(
						reservation.id,
						reservation.dateRangeStart,
						reservation.dateRangeEnd,
					)
					await this.addReservationToWaitList(reservation)
				}
				return
			}
			default:
				this.loggerService.error('Error while performing reservation', error)
				await this.ntfyProvider.sendErrorPerformingReservationNotification(
					reservation.id,
					reservation.dateRangeStart,
					reservation.dateRangeEnd,
					error,
				)
				throw error
		}
	}

	async performReservation(reservation: Reservation) {
		try {
			await this.brService.performReservation(reservation)
			await this.reservationsService.deleteById(reservation.id)
		} catch (error: unknown) {
			await this.handleReservationErrors(error as Error, reservation)
		}
	}

	async addReservationToWaitList(reservation: Reservation) {
		try {
			const waitingListId = await this.brService.addReservationToWaitList(
				reservation,
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
