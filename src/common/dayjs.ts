import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/nl'
import { asyncLocalStorage } from './logger'

dayjs.extend(isSameOrBefore)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('nl')

dayjs.tz.setDefault('Europe/Amsterdam')

const dayjsTz = (
  date?: string | number | Date | dayjs.Dayjs | null | undefined
) => {
  asyncLocalStorage.getStore()?.debug(`<dayjs> timezoning ${date}`)
  return dayjs(date).tz()
}

export default dayjsTz
