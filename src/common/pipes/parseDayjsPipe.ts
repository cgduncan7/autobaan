import { BadRequestException, PipeTransform } from '@nestjs/common'

import dayjsTz from '../dayjs'

export class ParseDayjsPipe implements PipeTransform {
	transform(value: any) {
		switch (typeof value) {
			case 'undefined':
				return undefined
			case 'string':
				return dayjsTz(value)
			default:
				throw new BadRequestException('Non-parsable date')
		}
	}
}
