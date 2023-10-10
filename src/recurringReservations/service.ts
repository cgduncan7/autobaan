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

	async create({
		ownerId,
		dayOfWeek,
		timeStart,
		timeEnd,
		opponentId = '-1',
		opponentName = 'Gast',
	}: {
		ownerId: string
		dayOfWeek: DayOfWeek
		timeStart: string
		timeEnd?: string
		opponentId?: string
		opponentName?: string
	}) {
		const recRes = this.recurringReservationsRepository.create({
			ownerId,
			dayOfWeek,
			timeStart,
			timeEnd: timeEnd ?? timeStart,
			opponentId,
			opponentName,
		})
		return await this.recurringReservationsRepository.save(recRes)
	}

	scheduleReservation(recurringReservation: RecurringReservation) {
		const reservation = recurringReservation.createReservationInAdvance()
		return this.reservationsService.create(reservation)
	}

	async deleteById(id: string) {
		await this.recurringReservationsRepository.delete({ id })
	}
}
