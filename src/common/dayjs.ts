import 'dayjs/locale/nl'

import * as dayjs from 'dayjs'
import * as customParseFormat from 'dayjs/plugin/customParseFormat'
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import * as timezone from 'dayjs/plugin/timezone'
import * as utc from 'dayjs/plugin/utc'

dayjs.extend(customParseFormat)
dayjs.extend(isSameOrBefore)
dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.locale('nl')

dayjs.tz.setDefault('Europe/Amsterdam')

export interface DateRange {
	start: dayjs.Dayjs
	end: dayjs.Dayjs
}

export interface SerializedDateRange {
	start: string
	end: string
}

export const setDefaults = () => dayjs.tz.setDefault('Europe/Amsterdam')

export const convertDateRangeStringToObject = ({
	start,
	end,
}: {
	start: string
	end: string
}): DateRange => ({ start: dayjs(start), end: dayjs(end) })

const dayjsTz = (
	date?: string | number | Date | dayjs.Dayjs | null | undefined,
	format?: string,
) => {
	return dayjs(date, format).tz('Europe/Amsterdam')
}

export default dayjsTz
