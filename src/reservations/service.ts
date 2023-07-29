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

	getAll() {
		return this.reservationsRepository.find()
	}

	getById(id: string) {
		return this.reservationsRepository.findOneBy({ id })
	}

	getByDate(date = dayjs()) {
		return this.reservationsRepository
			.createQueryBuilder()
			.where(`DATE(dateRangeStart, '-7 day') = DATE(:date)`, { date })
			.getMany()
	}

	getByDateOnWaitingList(date = dayjs()) {
		return this.reservationsRepository
			.createQueryBuilder()
			.where(`DATE(dateRangeStart, '-7 day') = DATE(:date)`, { date })
			.andWhere('waitListed = true')
			.getMany()
	}

	create(reservation: Reservation) {
		return this.reservationsRepository.save(reservation)
	}

	async deleteById(id: string) {
		await this.reservationsRepository.delete({ id })
	}
}
