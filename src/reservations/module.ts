import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { LoggerModule } from '../logger/module'
import { NtfyModule } from '../ntfy/module'
import { RunnerModule } from '../runner/module'
import { RESERVATIONS_QUEUE_NAME } from './config'
import { ReservationsController } from './controller'
import { ReservationsCronService } from './cron'
import { Reservation } from './entity'
import { ReservationsService } from './service'
import { ReservationsWorker } from './worker'

@Module({
	imports: [
		LoggerModule,
		TypeOrmModule.forFeature([Reservation]),
		BullModule.registerQueueAsync({ name: RESERVATIONS_QUEUE_NAME }),
		RunnerModule,
		NtfyModule,
	],
	exports: [ReservationsService],
	controllers: [ReservationsController],
	providers: [ReservationsService, ReservationsWorker, ReservationsCronService],
})
export class ReservationsModule {}
