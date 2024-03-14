import type { Queue } from 'bull'

import type { Reservation } from './entity'

export const RESERVATIONS_QUEUE_NAME = 'reservations'

export type ReservationsQueue = Queue<Reservation>
