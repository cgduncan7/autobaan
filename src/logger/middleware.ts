import { Inject, Injectable, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'

import { LoggerService } from './service'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
	constructor(
		@Inject(LoggerService)
		private readonly loggerService: LoggerService,
	) {}

	use(req: Request, _res: Response, next: NextFunction) {
		this.loggerService.log(`${req.method} ${req.originalUrl}`)
		next()
	}
}
