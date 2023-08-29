/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Injectable } from '@nestjs/common'
import { Logger, QueryRunner } from 'typeorm'

import { LoggerService } from './service.logger'

@Injectable()
export class DatabaseLoggerService implements Logger {
	constructor(
		@Inject(LoggerService)
		private loggerService: LoggerService,
	) {}

	logQuery(
		query: string,
		parameters?: any[] | undefined,
		_queryRunner?: QueryRunner | undefined,
	) {
		this.loggerService.debug('Query', { query, parameters })
	}

	logQueryError(
		error: string | Error,
		query: string,
		parameters?: any[] | undefined,
		_queryRunner?: QueryRunner | undefined,
	) {
		this.loggerService.error('Query error', { error, query, parameters })
	}

	logQuerySlow(
		time: number,
		query: string,
		parameters?: any[] | undefined,
		_queryRunner?: QueryRunner | undefined,
	) {
		this.loggerService.warn('Slow query', { time, query, parameters })
	}

	logSchemaBuild(message: string, _queryRunner?: QueryRunner | undefined) {
		this.log('info', message)
	}

	logMigration(message: string, _queryRunner?: QueryRunner | undefined) {
		this.log('info', message)
	}

	log(
		level: 'log' | 'info' | 'warn',
		message: any,
		_queryRunner?: QueryRunner | undefined,
	) {
		let logFn: (message: any) => void
		switch (level) {
			case 'warn':
				logFn = this.loggerService.warn
				break
			case 'log':
			case 'info':
			default:
				logFn = this.loggerService.log
		}

		logFn(message)
	}
}
