import { Dayjs } from 'dayjs'

import { asyncLocalStorage } from './logger'
import { Reservation } from './reservation'
import { validateJSONRequest } from './request'
import { reserve } from './reserver'

export interface ScheduledReservation {
  reservation: Reservation
  scheduledFor?: Dayjs
}

export interface SchedulerResult {
  scheduledReservation?: ScheduledReservation
}

export type SchedulerInput = Record<string, unknown>

export const schedule = async (
  payload: SchedulerInput
): Promise<SchedulerResult> => {
  const logger = asyncLocalStorage.getStore()

  logger?.debug('Handling reservation', { payload })
  let reservation: Reservation
  try {
    reservation = await validateJSONRequest(payload)
  } catch (err) {
    logger?.error('Failed to validate request', { err })
    throw err
  }

  logger?.debug('Successfully validated request', {
    reservation: reservation.format(),
  })

  if (!reservation.isAvailableForReservation()) {
    logger?.debug(
      'Reservation date is more than 7 days away; saving for later reservation'
    )

    await Reservation.save(reservation)

    return {
      scheduledReservation: {
        reservation,
        scheduledFor: reservation.getAllowedReservationDate(),
      },
    }
  }

  logger?.info('Reservation request can be performed now')
  await reserve(reservation)
  return {
    scheduledReservation: { reservation },
  }
}