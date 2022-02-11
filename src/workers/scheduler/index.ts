import { Dayjs } from 'dayjs'
import { v4 } from 'uuid'

import { Logger, LogLevel } from '../../common/logger'
import { Reservation } from '../../common/reservation'
import { ReservationRequest, validateJSONRequest } from '../../common/request'
import { scheduleDateToRequestReservation } from '../../common/schedule'
import { Worker } from '../types'

export interface ScheduledReservationRequest {
  reservationRequest: ReservationRequest
  scheduledFor?: Dayjs
}

export interface ReservationSchedulerResult {
  scheduledReservationRequest?: ScheduledReservationRequest
}

export interface ReservationSchedulerInput
  extends Omit<ReservationRequest, 'dateRange'> {
  dateRange: { start: string; end: string }
}

export const work: Worker<ReservationSchedulerInput, ReservationSchedulerResult> = async (
  payload: ReservationSchedulerInput,
): Promise<ReservationSchedulerResult> => {
  Logger.instantiate('reservationScheduler', v4(), LogLevel.DEBUG)
  Logger.debug('Handling reservation', { payload })
  let reservationRequest: ReservationRequest
  try {
    reservationRequest = validateJSONRequest(payload)
  } catch (err) {
    Logger.error('Failed to validate request', { err })
    throw err
  }

  Logger.debug('Successfully validated request', { reservationRequest })

  const res = new Reservation(
    reservationRequest.dateRange,
    reservationRequest.opponent
  )

  if (!res.isAvailableForReservation()) {
    Logger.debug('Reservation date is more than 7 days away')
    const scheduledDay = scheduleDateToRequestReservation(
      reservationRequest.dateRange.start
    )
    Logger.info(
      `Scheduling reservation request for ${scheduledDay.format('YYYY-MM-DD')}`
    )
    return {
      scheduledReservationRequest: {
        reservationRequest,
        scheduledFor: scheduledDay,
      },
    }
  }

  Logger.info('Reservation request can be performed now')
  return {
    scheduledReservationRequest: { reservationRequest },
  }
}
