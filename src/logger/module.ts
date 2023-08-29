import { Module } from '@nestjs/common'

import { LoggerMiddleware } from './middleware'
import { DatabaseLoggerService } from './service.database_logger'
import { LoggerService } from './service.logger'

@Module({
	providers: [LoggerService, DatabaseLoggerService, LoggerMiddleware],
	exports: [LoggerService, DatabaseLoggerService, LoggerMiddleware],
})
export class LoggerModule {}
