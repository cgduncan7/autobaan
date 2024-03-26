import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { LoggerModule } from '../logger/module'
import { NtfyModule } from '../ntfy/module'
import { MONITORING_QUEUE_NAME } from './config'
import { Monitor } from './entity'
import { MonitorsService } from './service'
import { MonitoringWorker } from './worker'

@Module({
	imports: [
		LoggerModule,
		NtfyModule,
		TypeOrmModule.forFeature([Monitor]),
		BullModule.registerQueueAsync({ name: MONITORING_QUEUE_NAME }),
	],
	providers: [MonitorsService, MonitoringWorker],
	exports: [MonitorsService],
})
export class MonitoringModule {}
