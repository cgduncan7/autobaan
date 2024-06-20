import type { Job, Queue } from 'bull'

import type { Reservation } from './entity'

export const RESERVATIONS_QUEUE_NAME = 'reservations'

interface ReservationsQueueJobPayload {
	reservation: Reservation
	speedyMode: boolean
}

export type ReservationsQueue = Queue<ReservationsQueueJobPayload>
export type ReservationsJob = Job<ReservationsQueueJobPayload>
