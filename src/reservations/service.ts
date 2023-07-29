import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import dayjs from '../common/dayjs'
import { Reservation } from './entity'

@Injectable()
export class ReservationsService {
	constructor(
		@InjectRepository(Reservation)
		private reservationsRepository: Repository<Reservation>,
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
			.where(`DATE(dateRangeStart, '-7 day') = DATE(:date)`, { date })
			.getMany()
	}

	async getByDateOnWaitingList(date = dayjs()) {
		return await this.reservationsRepository
			.createQueryBuilder()
			.where(`DATE(dateRangeStart, '-7 day') = DATE(:date)`, { date })
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
		return await this.reservationsRepository.delete({ id })
	}
}
