import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { ReservationsService } from '../reservations/service'
import { DayOfWeek, RecurringReservation } from './entity'

@Injectable()
export class RecurringReservationsService {
	constructor(
		@InjectRepository(RecurringReservation)
		private recurringReservationsRepository: Repository<RecurringReservation>,
		@Inject(ReservationsService)
		private reservationsService: ReservationsService,
	) {}

	getAll() {
		return this.recurringReservationsRepository.find()
	}

	getById(id: string) {
		return this.recurringReservationsRepository.findOneBy({ id })
	}

	getByDayOfWeek(dayOfWeek: DayOfWeek) {
		return this.recurringReservationsRepository
			.createQueryBuilder()
			.where({ dayOfWeek })
			.getMany()
	}

	create(recurringReservation: RecurringReservation) {
		return this.recurringReservationsRepository.save(recurringReservation)
	}

	scheduleReservation(recurringReservation: RecurringReservation) {
		const reservation = recurringReservation.createReservationInAdvance()
		return this.reservationsService.create(reservation)
	}

	async deleteById(id: string) {
		await this.recurringReservationsRepository.delete({ id })
	}
}
