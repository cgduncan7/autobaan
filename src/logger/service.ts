import { ConsoleLogger, Injectable, Scope } from '@nestjs/common'

@Injectable({ scope: Scope.REQUEST })
export class LoggerService extends ConsoleLogger {
	log(message: any, ...optionalParams: any[]) {
		super.log(message, ...optionalParams)
	}
	error(message: any, ...optionalParams: any[]) {
		super.error(message, ...optionalParams)
	}
	warn(message: any, ...optionalParams: any[]) {
		super.warn(message, ...optionalParams)
	}
}
