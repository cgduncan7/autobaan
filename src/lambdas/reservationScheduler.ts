import { Context, Handler } from 'aws-lambda'
import { Dayjs } from 'dayjs'

import { Logger, LogLevel } from '../common/logger'
import { Reservation } from '../common/reservation'
import {
  validateRequest,
  ReservationRequest,
} from '../common/request'
import { scheduleDateToRequestReservation } from '../common/schedule'

export interface ScheduledReservationRequest {
  reservationRequest: ReservationRequest
  scheduledFor?: Dayjs
}

export interface ReservationSchedulerResult {
  scheduledReservationRequest?: ScheduledReservationRequest
}

const handler: Handler<string, ReservationSchedulerResult> = async (
  payload: string,
  context: Context,
): Promise<ReservationSchedulerResult> => {
  const logger = new Logger(context.awsRequestId, LogLevel.DEBUG)
  logger.debug('Handling event', { payload })
  let reservationRequest: ReservationRequest
  try {
    reservationRequest = validateRequest(payload)
  } catch (err) {
    logger.error('Failed to validate request', { err })
    throw err
  }

  logger.debug('Successfully validated request', { reservationRequest })

  const res = new Reservation(
    reservationRequest.dateRange,
    reservationRequest.opponent
  )

  if (!res.isAvailableForReservation()) {
    logger.debug('Reservation date is more than 7 days away')
    const scheduledDay = scheduleDateToRequestReservation(
      reservationRequest.dateRange.start
    )
    logger.info(
      `Scheduling reservation request for ${scheduledDay.format('YYYY-MM-DD')}`
    )
    return {
      scheduledReservationRequest: {
        reservationRequest,
        scheduledFor: scheduledDay,
      },
    }
  }

  logger.info('Reservation request can be performed now')
  return {
    scheduledReservationRequest: { reservationRequest },
  }
}

export default handler
