import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { LoggerModule } from '../logger/module'
import { RunnerModule } from '../runner/module'
import { RESERVATIONS_QUEUE_NAME } from './config'
import { ReservationsController } from './controller'
import { Reservation } from './entity'
import { ReservationsService } from './service'
import { ReservationsWorker } from './worker'

@Module({
	imports: [
		LoggerModule,
		TypeOrmModule.forFeature([Reservation]),
		BullModule.registerQueue({ name: RESERVATIONS_QUEUE_NAME }),
		RunnerModule,
	],
	controllers: [ReservationsController],
	providers: [ReservationsService, ReservationsWorker],
})
export class ReservationsModule {}
