import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { LoggerModule } from '../logger/module'
import { ReservationsService } from '../reservations/service'
import { RunnerModule } from '../runner/module'
import { RecurringReservationsController } from './controller'
import { RecurringReservation } from './entity'
import { RecurringReservationsService } from './service'

@Module({
	imports: [
		LoggerModule,
		TypeOrmModule.forFeature([RecurringReservation]),
		RunnerModule,
		ReservationsService,
	],
	controllers: [RecurringReservationsController],
	providers: [RecurringReservationsService],
})
export class RecurringReservationsModule {}
