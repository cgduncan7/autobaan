import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { LoggerModule } from '../logger/module'
import { MembersController } from './controller'
import { MembersService } from './service'

@Module({
	imports: [LoggerModule, ConfigModule],
	providers: [MembersService],
	controllers: [MembersController],
})
export class MembersModule {}
