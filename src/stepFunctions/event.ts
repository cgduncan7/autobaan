import { ReservationRequest } from "../common/request";

export interface RawReservationRequest extends Omit<ReservationRequest, 'dateRanges'> {
  dateRanges: { start: string, end: string }[]
}

export interface InputEvent {
  reservationRequest: RawReservationRequest
}