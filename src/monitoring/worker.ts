import { Process, Processor } from '@nestjs/bull'
import { Inject } from '@nestjs/common'
import { Job } from 'bull'

import { MONITORING_QUEUE_NAME } from './config'
import { MonitorType } from './entity'
import { MonitorsService } from './service'

@Processor(MONITORING_QUEUE_NAME)
export class MonitoringWorker {
	constructor(
		@Inject(MonitorsService)
		private readonly monitorsService: MonitorsService,
	) {}

	@Process()
	async handleMonitoringCourtsJob(
		job: Job<{ type: MonitorType; data: unknown }>,
	) {
		await this.monitorsService.performMonitor(job.data.type, job.data.data)
	}
}
