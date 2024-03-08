import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Monitor, MonitorType } from './entity'

@Injectable()
export class MonitorsService {
	constructor(
		@InjectRepository(Monitor)
		private readonly monitorsRepository: Repository<Monitor>,
	) {}

	async performMonitor(type: MonitorType, data: unknown) {
		await this.monitorsRepository.save(
			this.monitorsRepository.create({ type, data }),
		)
	}
}
