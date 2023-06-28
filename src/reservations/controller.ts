import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Delete,
	Inject,
	UsePipes,
	ValidationPipe,
	UseInterceptors,
	ClassSerializerInterceptor,
	Query,
} from '@nestjs/common'
import { InjectQueue } from '@nestjs/bull'
import { Dayjs } from 'dayjs'
import { Queue } from 'bull'
import { RESERVATIONS_QUEUE_NAME } from './config'
import { Reservation } from './entity'
import { ReservationsService } from './service'
import { LoggerService } from '../logger/service'

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
	getReservations(@Query('date') date?: Dayjs) {
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
		if (!reservation.isAvailableForReservation()) {
			this.loggerService.debug('Reservation not available for reservation')
			await this.reservationsService.create(reservation)
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
