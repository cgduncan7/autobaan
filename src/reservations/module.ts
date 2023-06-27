import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Reservation } from './entity'
import { ReservationsController } from './controller'
import config, { RESERVATIONS_QUEUE_NAME } from './config'
import { ReservationsService } from './service'
import { ReservationsWorker } from './worker'
import { LoggerModule } from '../logger/module'
import { RunnerModule } from '../runner/module'

@Module({
	imports: [
		LoggerModule,
		TypeOrmModule.forFeature([Reservation]),
		BullModule.registerQueue({ name: RESERVATIONS_QUEUE_NAME }),
		RunnerModule,
		ConfigModule.forFeature(config),
	],
	controllers: [ReservationsController],
	providers: [ReservationsService, ReservationsWorker],
})
export class ReservationsModule {}
