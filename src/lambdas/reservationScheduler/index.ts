import { Context, Handler } from 'aws-lambda'
import { Dayjs } from 'dayjs'

import { Logger, LogLevel } from '../../common/logger'
import { Reservation } from '../../common/reservation'
import { ReservationRequest, validateJSONRequest } from '../../common/request'
import { scheduleDateToRequestReservation } from '../../common/schedule'

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

export const handler: Handler<
  ReservationSchedulerInput,
  ReservationSchedulerResult
> = async (
  payload: ReservationSchedulerInput,
  context: Context
): Promise<ReservationSchedulerResult> => {
  Logger.instantiate(context.awsRequestId, LogLevel.DEBUG)
  Logger.debug('Handling event', { payload })
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
