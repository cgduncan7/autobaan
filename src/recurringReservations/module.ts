import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ReservationsModule } from 'src/reservations/module'

import { LoggerModule } from '../logger/module'
import { RunnerModule } from '../runner/module'
import { RecurringReservationsController } from './controller'
import { RecurringReservationsCronService } from './cron'
import { RecurringReservation } from './entity'
import { RecurringReservationsService } from './service'

@Module({
	imports: [
		LoggerModule,
		TypeOrmModule.forFeature([RecurringReservation]),
		RunnerModule,
		ReservationsModule,
	],
	controllers: [RecurringReservationsController],
	providers: [RecurringReservationsService, RecurringReservationsCronService],
})
export class RecurringReservationsModule {}
