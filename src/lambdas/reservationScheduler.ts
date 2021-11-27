import { Handler } from 'aws-lambda'
import { Dayjs } from 'dayjs'

import { InputEvent } from '../stepFunctions/event'
import { Reservation } from '../common/reservation'
import { validateRequest, ReservationRequest } from '../common/request'
import { scheduleDateToRequestReservation } from '../common/schedule'

export interface ScheduledReservationRequest {
  reservationRequest: ReservationRequest
  availableAt: Dayjs
}

export const run: Handler<InputEvent, void> = async (input: InputEvent): Promise<void> => {
  console.log(`Handling event: ${input}`)
  const reservationRequest = validateRequest(JSON.stringify(input.reservationRequest))
  console.log('Successfully validated request')

  const res = new Reservation(reservationRequest.dateRange, reservationRequest.opponent)
  if (!res.isAvailableForReservation()) {
    console.log('Reservation date is more than 7 days away; scheduling for later')
    scheduleDateToRequestReservation(reservationRequest.dateRange.start)
  }
}
