import { Module } from '@nestjs/common'

import { LoggerMiddleware } from './middleware'
import { LoggerService } from './service'

@Module({
	providers: [LoggerService, LoggerMiddleware],
	exports: [LoggerService, LoggerMiddleware],
})
export class LoggerModule {}
