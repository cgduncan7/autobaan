import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Dayjs } from 'dayjs'
import { Repository } from 'typeorm'

import dayjs from '../common/dayjs'
import { LoggerService } from '../logger/service.logger'
import { BaanReserverenService } from '../runner/baanreserveren/service'
import { Reservation, ReservationStatus } from './entity'

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

	async getAll(status?: ReservationStatus) {
		return await this.reservationsRepository.find({ where: { status } })
	}

	async getById(id: string) {
		return await this.reservationsRepository.findOneBy({ id })
	}

	async getByDate(date = dayjs(), status?: ReservationStatus) {
		let qb = this.reservationsRepository
			.createQueryBuilder()
			.where(`DATE(dateRangeStart) = DATE(:date)`, { date: date.toISOString() })

		if (status != null) {
			qb = qb.andWhere(`status = :status`, { status })
		}

		return await qb.orderBy('dateRangeStart', 'ASC').getMany()
	}

	/**
	 * Gets all reservations that have not been scheduled that are within the reservation window
	 * @returns Reservations that can be scheduled
	 */
	async getSchedulable() {
		const query = this.reservationsRepository
			.createQueryBuilder()
			.where(
				`DATE(dateRangeStart) BETWEEN DATE(:startDate) AND DATE(:endDate)`,
				{
					startDate: dayjs().add(1, 'days').toISOString(),
					endDate: dayjs().add(7, 'days').toISOString(),
				},
			)
			.andWhere('status <> :status', {
				status: ReservationStatus.OnWaitingList,
			})
			.orderBy('dateRangeStart', 'ASC')

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
			.andWhere('status = :status', { status: ReservationStatus.OnWaitingList })
			.getMany()
	}

	async create({
		ownerId,
		dateRangeStart,
		dateRangeEnd,
		opponents,
	}: {
		ownerId: string
		dateRangeStart: Dayjs
		dateRangeEnd?: Dayjs
		opponents?: { id: string; name: string }[]
	}) {
		const res = this.reservationsRepository.create({
			ownerId,
			dateRangeStart,
			dateRangeEnd: dateRangeEnd ?? dateRangeStart,
			opponents: opponents ?? [{ id: '-1', name: 'Gast' }],
		})
		return await this.reservationsRepository.save(res)
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
