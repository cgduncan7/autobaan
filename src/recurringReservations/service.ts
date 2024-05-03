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
		opponents,
	}: {
		ownerId: string
		dayOfWeek: DayOfWeek
		timeStart: string
		timeEnd?: string
		opponents?: { id: string; name: string }[]
	}) {
		const recRes = this.recurringReservationsRepository.create({
			ownerId,
			dayOfWeek,
			timeStart,
			timeEnd: timeEnd ?? timeStart,
			opponents: opponents ?? [{ id: '-1', name: 'Gast' }],
		})
		return await this.recurringReservationsRepository.save(recRes)
	}

	scheduleReservation(recurringReservation: RecurringReservation) {
		const reservation = recurringReservation.createReservationInAdvance()
		return this.reservationsService.create(reservation)
	}

	async update(
		id: string,
		updateRequest: {
			ownerId?: string
			dayOfWeek?: DayOfWeek
			timeStart?: string
			timeEnd?: string
			opponents?: { id: string; name: string }[]
		},
	) {
		await this.recurringReservationsRepository.update({ id }, updateRequest)
	}

	async deleteById(id: string) {
		await this.recurringReservationsRepository.delete({ id })
	}
}
