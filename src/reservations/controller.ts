import { InjectQueue } from '@nestjs/bull'
import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Delete,
	Get,
	Inject,
	Param,
	Post,
	Query,
	UseInterceptors,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { Queue } from 'bull'
import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional } from 'class-validator'
import { Dayjs } from 'dayjs'

import { LoggerService } from '../logger/service.logger'
import { RESERVATIONS_QUEUE_NAME } from './config'
import { Reservation } from './entity'
import { ReservationsService } from './service'

export class GetReservationsQueryParams {
	@IsOptional()
	@Transform(() => Dayjs)
	date?: Dayjs

	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => value === 'true')
	readonly schedulable?: boolean
}

@Controller('reservations')
@UseInterceptors(ClassSerializerInterceptor)
export class ReservationsController {
	constructor(
		@Inject(ReservationsService)
		private reservationsService: ReservationsService,

		@InjectQueue(RESERVATIONS_QUEUE_NAME)
		private reservationsQueue: Queue<Reservation>,

		@Inject(LoggerService)
		private loggerService: LoggerService,
	) {}

	@Get()
	getReservations(@Query() params: GetReservationsQueryParams) {
		const { schedulable, date } = params
		if (schedulable) {
			return this.reservationsService.getSchedulable()
		}
		if (date) {
			return this.reservationsService.getByDate(date)
		}
		return this.reservationsService.getAll()
	}

	@Get(':id')
	getReservationById(@Param('id') id: string) {
		return this.reservationsService.getById(id)
	}

	@Post()
	@UsePipes(
		new ValidationPipe({
			transform: true,
			transformOptions: { groups: ['password'] },
			groups: ['password'],
		}),
	)
	async createReservation(@Body() reservation: Reservation) {
		await this.reservationsService.create(reservation)
		if (!reservation.isAvailableForReservation()) {
			this.loggerService.debug('Reservation not available for reservation')
			return 'Reservation saved'
		}
		this.loggerService.debug('Reservation is available for reservation')
		await this.reservationsQueue.add(reservation)
		return 'Reservation queued'
	}

	@Delete(':id')
	async deleteReservationById(@Param('id') id: string) {
		await this.reservationsService.deleteById(id)
		return 'Reservation deleted'
	}
}
