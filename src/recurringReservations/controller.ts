import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Delete,
	Get,
	Inject,
	Param,
	Post,
	Put,
	Query,
	UseInterceptors,
} from '@nestjs/common'
import {
	IsArray,
	IsEnum,
	IsOptional,
	IsString,
	Matches,
	ValidateNested,
} from 'class-validator'

import { DayOfWeek } from './entity'
import { RecurringReservationsService } from './service'

export class CreateRecurringReservationOpponent {
	@IsString()
	id: string

	@IsString()
	name: string
}

export class CreateRecurringReservationRequest {
	@IsString()
	ownerId: string

	@IsEnum(DayOfWeek)
	dayOfWeek: number

	@IsString()
	@Matches(/[012][0-9]:[0-5][0-9]/)
	timeStart: string

	@IsOptional()
	@IsString()
	@Matches(/[012][0-9]:[0-5][0-9]/)
	timeEnd?: string

	@IsOptional()
	@IsArray()
	@ValidateNested()
	opponents?: CreateRecurringReservationOpponent[]
}

export class UpdateRecurringReservationRequest {
	@IsOptional()
	@IsString()
	ownerId?: string

	@IsOptional()
	@IsEnum(DayOfWeek)
	dayOfWeek?: number

	@IsOptional()
	@IsString()
	@Matches(/[012][0-9]:[0-5][0-9]/)
	timeStart?: string

	@IsOptional()
	@IsString()
	@Matches(/[012][0-9]:[0-5][0-9]/)
	timeEnd?: string

	@IsOptional()
	@IsArray()
	@ValidateNested()
	opponents?: CreateRecurringReservationOpponent[]
}

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
			return this.recurringReservationsService.getByDayOfWeek(dayOfWeek)
		}
		return this.recurringReservationsService.getAll()
	}

	@Get(':id')
	getRecurringReservationById(@Param('id') id: string) {
		return this.recurringReservationsService.getById(id)
	}

	@Post()
	async createRecurringReservation(
		@Body() req: CreateRecurringReservationRequest,
	) {
		await this.recurringReservationsService.create(req)
		return 'Recurring reservation created'
	}

	@Put(':id')
	async updateRecurringReservation(
		@Param('id') id: string,
		@Body() req: UpdateRecurringReservationRequest,
	) {
		await this.recurringReservationsService.update(id, req)
		return 'Recurring reservation updated'
	}

	@Delete(':id')
	async deleteRecurringReservationById(@Param('id') id: string) {
		await this.recurringReservationsService.deleteById(id)
		return 'Recurring reservation deleted'
	}
}
