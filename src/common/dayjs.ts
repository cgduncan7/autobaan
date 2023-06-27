import * as dayjs from 'dayjs'
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import * as utc from 'dayjs/plugin/utc'
import * as timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/nl'

dayjs.extend(isSameOrBefore)
dayjs.extend(utc)
dayjs.extend(timezone)
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

export const convertDateRangeStringToObject = ({
	start,
	end,
}: {
	start: string
	end: string
}): DateRange => ({ start: dayjs(start), end: dayjs(end) })

const dayjsTz = (
	date?: string | number | Date | dayjs.Dayjs | null | undefined,
) => {
	return dayjs(date).tz()
}

export default dayjsTz
