import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import dayjsTz from '../common/dayjs'
import { Monitor, MonitorType } from './entity'

@Injectable()
export class MonitorsService {
	constructor(
		@InjectRepository(Monitor)
		private readonly monitorsRepository: Repository<Monitor>,
	) {}

	async performMonitor(type: MonitorType, data: string) {
		await this.monitorsRepository.save(
			this.monitorsRepository.create({ type, data, createdAt: dayjsTz() }),
		)
	}
}
