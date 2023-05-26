import { Module } from '@nestjs/common'
import { LoggerService } from './service'
import { LoggerMiddleware } from './middleware'

@Module({
	providers: [LoggerService, LoggerMiddleware],
	exports: [LoggerService, LoggerMiddleware],
})
export class LoggerModule {}
