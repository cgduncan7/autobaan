import { Dayjs } from 'dayjs'

/**
 * 
 * @param requestedDate 
 * @returns 
 */
export const scheduleDateToRequestReservation = (requestedDate: Dayjs): Dayjs => {
  return requestedDate.hour(0).minute(0).second(0).millisecond(0).subtract(7, 'days')
}