import dayjs from '../../../src/common/dayjs'
import { RecurringReservation } from '../../../src/recurringReservations/entity'

describe('recurringReservations.entity', () => {
	describe('createReservationInAdvance', () => {
		it('should create reservation at same time in 7 days', async () => {
			jest.useFakeTimers().setSystemTime(new Date('2024-01-01'))
			const rr = new RecurringReservation({
				ownerId: '1',
				timeStart: '18:30',
				timeEnd: '19:15',
				dayOfWeek: 2,
			})
			const reservation = rr.createReservationInAdvance(7)
			expect(reservation.dateRangeStart).toEqual(dayjs('2024-01-09T18:30'))
		})

		it('should create reservation at same time in 7 days (DST --> NDST)', async () => {
			jest.useFakeTimers().setSystemTime(new Date('2024-03-28'))
			const rr = new RecurringReservation({
				ownerId: '1',
				timeStart: '18:30',
				timeEnd: '19:15',
				dayOfWeek: 4,
			})
			const reservation = rr.createReservationInAdvance(7)
			expect(reservation.dateRangeStart).toEqual(dayjs('2024-04-04T18:30'))
		})

		it('should create reservation at same time in 7 days (NDST --> DST)', async () => {
			jest.useFakeTimers().setSystemTime(new Date('2024-10-24'))
			const rr = new RecurringReservation({
				ownerId: '1',
				timeStart: '18:30',
				timeEnd: '19:15',
				dayOfWeek: 4,
			})
			const reservation = rr.createReservationInAdvance(7)
			expect(reservation.dateRangeStart).toEqual(dayjs('2024-10-31T18:30'))
		})
	})
})
