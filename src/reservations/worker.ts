import { Process, Processor } from '@nestjs/bull'
import { Inject } from '@nestjs/common'
import { Job } from 'bull'
import { instanceToPlain, plainToInstance } from 'class-transformer'

import { LoggerService } from '../logger/service'
import {
	BaanReserverenService,
	NoCourtAvailableError,
} from '../runner/baanreserveren/service'
import { RESERVATIONS_QUEUE_NAME } from './config'
import { Reservation } from './entity'

@Processor(RESERVATIONS_QUEUE_NAME)
export class ReservationsWorker {
	constructor(
		@Inject(BaanReserverenService)
		private readonly brService: BaanReserverenService,

		@Inject(LoggerService)
		private readonly loggerService: LoggerService,
	) {}

	@Process()
	async handleReservationJob(job: Job<Reservation>) {
		const reservation = plainToInstance(Reservation, job.data, {
			groups: ['password'],
		})
		this.loggerService.log('Handling reservation', {
			reservation: instanceToPlain(reservation),
		})
		await this.performReservation(reservation)
	}

	private async handleReservationErrors(
		error: unknown,
		reservation: Reservation,
	) {
		switch (true) {
			case error instanceof NoCourtAvailableError: {
				this.loggerService.warn('No court available, adding to waiting list')
				await this.addReservationToWaitList(reservation)
				return
			}
			default:
				this.loggerService.error('Error while performing reservation', {
					error,
				})
				throw error
		}
	}

	async performReservation(reservation: Reservation) {
		try {
			await this.brService.performReservation(reservation)
		} catch (error: unknown) {
			await this.handleReservationErrors(error, reservation)
		}
	}

	async addReservationToWaitList(reservation: Reservation) {
		await this.brService.addReservationToWaitList(reservation)
	}
}
