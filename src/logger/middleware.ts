import { Inject, Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { LoggerService } from './service'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(LoggerService)
    private readonly logger: LoggerService,
  ) {}

  use(req: Request, _res: Response, next: NextFunction) {
    this.logger.log(`${req.method} ${req.originalUrl}`)
    next()
  }
}
