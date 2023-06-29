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

import { DayOfWeek, RecurringReservation } from './entity'
import { RecurringReservationsService } from './service'

@Controller('recurring-reservations')
@UseInterceptors(ClassSerializerInterceptor)
export class RecurringReservationsController {
	constructor(
		@Inject(RecurringReservationsService)
		private recurringReservationsService: RecurringReservationsService,
	) {}

	@Get()
	getRecurringReservations(@Query('dayOfWeek') dayOfWeek?: DayOfWeek) {
		if (dayOfWeek) {
			return this.recurringReservationsService.getByDayOfWeek
		}
		return this.recurringReservationsService.getAll()
	}

	@Get(':id')
	getReservationById(@Param('id') id: string) {
		return this.recurringReservationsService.getById(id)
	}

	@Post()
	@UsePipes(
		new ValidationPipe({
			transform: true,
			transformOptions: { groups: ['password'] },
			groups: ['password'],
		}),
	)
	async createReservation(@Body() recurringReservation: RecurringReservation) {
		await this.recurringReservationsService.create(recurringReservation)
		return 'Recurring reservation created'
	}

	@Delete(':id')
	async deleteReservationById(@Param('id') id: string) {
		await this.recurringReservationsService.deleteById(id)
		return 'Recurring reservation deleted'
	}
}
