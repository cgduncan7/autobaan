import { Process, Processor } from '@nestjs/bull'
import { Inject } from '@nestjs/common'
import { Job } from 'bull'

import { LoggerService } from '../logger/service.logger'
import { MONITORING_QUEUE_NAME } from './config'
import { MonitorType } from './entity'
import { MonitorsService } from './service'

export interface MonitoringQueueData {
	type: MonitorType
	data: any
}

@Processor(MONITORING_QUEUE_NAME)
export class MonitoringWorker {
	constructor(
		@Inject(MonitorsService)
		private readonly monitorsService: MonitorsService,

		@Inject(LoggerService)
		private readonly loggerService: LoggerService,
	) {}

	@Process()
	async handleMonitoringCourtsJob(job: Job<MonitoringQueueData>) {
		let json
		try {
			json = JSON.stringify(job.data.data)
		} catch (error) {
			this.loggerService.error('Could not stringify data')
			return
		}
		await this.monitorsService
			.performMonitor(job.data.type, json)
			.catch((error) =>
				this.loggerService.error(
					`Failed to monitor courts: ${(error as Error).message}`,
				),
			)
	}
}
