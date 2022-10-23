import { Dayjs } from 'dayjs'
import { v4 } from 'uuid'

import { Logger, LogLevel } from '../../common/logger'
import { Reservation } from '../../common/reservation'
import { validateJSONRequest } from '../../common/request'
import { Worker } from '../types'

export interface ScheduledReservation {
  reservation: Reservation
  scheduledFor?: Dayjs
}

export interface SchedulerResult {
  scheduledReservation?: ScheduledReservation
}

export type SchedulerInput = Record<string, unknown>

export const work: Worker<SchedulerInput, SchedulerResult> = async (
  payload: SchedulerInput
): Promise<SchedulerResult> => {
  Logger.instantiate('scheduler', v4(), LogLevel.DEBUG)

  // TODO: obfuscate payload
  Logger.debug('Handling reservation', { payload })
  let reservation: Reservation
  try {
    reservation = await validateJSONRequest(payload)
  } catch (err) {
    Logger.error('Failed to validate request', { err })
    throw err
  }

  Logger.debug('Successfully validated request', {
    reservation: reservation.format(),
  })

  if (!reservation.isAvailableForReservation()) {
    Logger.debug(
      'Reservation date is more than 7 days away; saving for later reservation'
    )
    return {
      scheduledReservation: {
        reservation,
        scheduledFor: reservation.getAllowedReservationDate(),
      },
    }
  }

  Logger.info('Reservation request can be performed now')
  return {
    scheduledReservation: { reservation },
  }
}
