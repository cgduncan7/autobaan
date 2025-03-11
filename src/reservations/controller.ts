import { InjectQueue } from '@nestjs/bull'
import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Delete,
	Get,
	HttpException,
	Inject,
	Param,
	Post,
	Query,
	UseInterceptors,
} from '@nestjs/common'
import { Transform } from 'class-transformer'
import {
	IsArray,
	IsBoolean,
	IsEnum,
	IsOptional,
	IsString,
	ValidateNested,
} from 'class-validator'
import { Dayjs } from 'dayjs'

import { DayjsTransformer } from '../common/dayjs'
import { LoggerService } from '../logger/service.logger'
import { RESERVATIONS_QUEUE_NAME, ReservationsQueue } from './config'
import { ReservationStatus } from './entity'
import { ReservationsService } from './service'

export class GetReservationsQueryParams {
	@IsOptional()
	@Transform(() => Dayjs)
	readonly date?: Dayjs

	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => value === 'true')
	readonly schedulable?: boolean

	@IsOptional()
	@IsEnum(ReservationStatus)
	readonly status?: ReservationStatus
}

export class CreateReservationOpponent {
	@IsString()
	readonly id: string

	@IsString()
	readonly name: string
}

export class CreateReservationRequest {
	@IsString()
	readonly ownerId: string

	@Transform(DayjsTransformer)
	readonly dateRangeStart: Dayjs

	@IsOptional()
	@Transform(DayjsTransformer)
	readonly dateRangeEnd?: Dayjs

	@IsOptional()
	@IsArray()
	@ValidateNested()
	readonly opponents?: CreateReservationOpponent[]
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
		const { schedulable, date, status } = params
		if (schedulable) {
			return this.reservationsService.getSchedulable()
		}
		if (date) {
			return this.reservationsService.getByDate(date, status)
		}
		return this.reservationsService.getAll(status)
	}

	@Get(':id')
	getReservationById(@Param('id') id: string) {
		return this.reservationsService.getById(id)
	}

	@Post()
	async createReservation(@Body() req: CreateReservationRequest) {
		const reservation = await this.reservationsService.create(req)
		if (!reservation.isAvailableForReservation()) {
			this.loggerService.debug('Reservation not available for reservation')
			return 'Reservation saved'
		}
		this.loggerService.debug('Reservation is available for reservation')
		await this.reservationsQueue.add({ reservation, speedyMode: true })
		return 'Reservation queued'
	}

	@Post(':id')
	async performReservation(@Param('id') id: string) {
		const reservation = await this.reservationsService.getById(id)
		if (reservation == null) throw new HttpException('Not found', 404)

		if (!reservation.isAvailableForReservation())
			throw new HttpException('Not available', 400)

		await this.reservationsQueue.add({ reservation, speedyMode: true })
		return 'Reservation queued'
	}

	@Delete(':id')
	async deleteReservationById(@Param('id') id: string) {
		await this.reservationsService.deleteById(id)
		return 'Reservation deleted'
	}
}
