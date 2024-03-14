import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'

import { LoggerModule } from '../logger/module'
import { MONITORING_QUEUE_NAME } from '../monitoring/config'
import { MonitoringModule } from '../monitoring/module'
import { BaanReserverenService } from './baanreserveren/service'
import { EmptyPageFactory } from './pages/empty'
import { RunnerService } from './service'

@Module({
	providers: [
		RunnerService,
		BaanReserverenService,
		MonitoringModule,
		EmptyPageFactory,
	],
	imports: [
		LoggerModule,
		BullModule.registerQueueAsync({ name: MONITORING_QUEUE_NAME }),
	],
	exports: [EmptyPageFactory, BaanReserverenService],
})
export class RunnerModule {}
