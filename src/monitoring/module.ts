import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { LoggerModule } from '../logger/module'
import { NtfyModule } from '../ntfy/module'
import { Monitor } from './entity'
import { MonitorsService } from './service'

@Module({
	imports: [LoggerModule, NtfyModule, TypeOrmModule.forFeature([Monitor])],
	providers: [MonitorsService],
	exports: [MonitorsService],
})
export class MonitoringModule {}
