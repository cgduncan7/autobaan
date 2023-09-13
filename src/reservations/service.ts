import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import dayjs from '../common/dayjs'
import { LoggerService } from '../logger/service.logger'
import { BaanReserverenService } from '../runner/baanreserveren/service'
import { Reservation } from './entity'

@Injectable()
export class ReservationsService {
	constructor(
		@InjectRepository(Reservation)
		private reservationsRepository: Repository<Reservation>,

		@Inject(BaanReserverenService)
		private readonly brService: BaanReserverenService,

		@Inject(LoggerService)
		private readonly loggerService: LoggerService,
	) {}

	async getAll() {
		return await this.reservationsRepository.find()
	}

	async getById(id: string) {
		return await this.reservationsRepository.findOneBy({ id })
	}

	async getByDate(date = dayjs()) {
		return await this.reservationsRepository
			.createQueryBuilder()
			.where(`DATE(dateRangeStart) = DATE(:date)`, { date })
			.getMany()
	}

	/**
	 * Gets all reservations that have not been scheduled that are within the reservation window
	 * @returns Reservations that can be scheduled
	 */
	async getSchedulable() {
		const query = this.reservationsRepository
			.createQueryBuilder()
			.where(`DATE(dateRangeStart) <= DATE(:date)`, {
				date: dayjs().add(7, 'days').toISOString(),
			})
			.andWhere(`waitListed = false`)

		this.loggerService.debug('Query: ' + query.getSql())

		return await query.getMany()
	}

	async getByDateOnWaitingList(date = dayjs()) {
		return await this.reservationsRepository
			.createQueryBuilder()
			.where(`DATE(dateRangeStart) <= DATE(:date)`, {
				date: date.toISOString(),
			})
			.andWhere(`DATE(dateRangeEnd) >= DATE(:date)`, {
				date: date.toISOString(),
			})
			.andWhere('waitListed = true')
			.getMany()
	}

	async create(reservation: Reservation) {
		return await this.reservationsRepository.save(reservation)
	}

	async update(reservationId: string, update: Partial<Reservation>) {
		return await this.reservationsRepository.update(reservationId, update)
	}

	async deleteById(id: string) {
		const reservation = await this.getById(id)
		if (!reservation) return

		await this.brService.removeReservationFromWaitList(reservation)
		return await this.reservationsRepository.delete({ id: reservation.id })
	}
}
