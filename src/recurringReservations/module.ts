import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { LoggerModule } from '../logger/module'
import { NtfyModule } from '../ntfy/module'
import { ReservationsModule } from '../reservations/module'
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
		NtfyModule,
	],
	controllers: [RecurringReservationsController],
	providers: [RecurringReservationsService, RecurringReservationsCronService],
})
export class RecurringReservationsModule {}
