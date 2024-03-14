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
} from '@nestjs/common'
import { Transform, TransformationType } from 'class-transformer'
import { IsBoolean, IsOptional, IsString } from 'class-validator'
import { Dayjs } from 'dayjs'

import dayjs from '../common/dayjs'
import { LoggerService } from '../logger/service.logger'
import { RESERVATIONS_QUEUE_NAME, ReservationsQueue } from './config'
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

export class CreateReservationRequest {
	@IsString()
	ownerId: string

	@Transform(({ value, type }) => {
		switch (type) {
			case TransformationType.PLAIN_TO_CLASS:
				return dayjs(value)
			case TransformationType.CLASS_TO_PLAIN:
				return value.format()
			default:
				return value
		}
	})
	dateRangeStart: Dayjs

	@IsOptional()
	@Transform(({ value, type }) => {
		switch (type) {
			case TransformationType.PLAIN_TO_CLASS:
				return dayjs(value)
			case TransformationType.CLASS_TO_PLAIN:
				return value.format()
			default:
				return value
		}
	})
	dateRangeEnd?: Dayjs

	@IsOptional()
	@IsString()
	opponentId?: string

	@IsOptional()
	@IsString()
	opponentName?: string
}

@Controller('reservations')
@UseInterceptors(ClassSerializerInterceptor)
export class ReservationsController {
	constructor(
		@Inject(ReservationsService)
		private reservationsService: ReservationsService,

		@InjectQueue(RESERVATIONS_QUEUE_NAME)
		private reservationsQueue: ReservationsQueue,

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
	async createReservation(@Body() req: CreateReservationRequest) {
		console.log(req)
		const reservation = await this.reservationsService.create(req)
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
