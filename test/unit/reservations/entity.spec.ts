import dayjs from '../../../src/common/dayjs'
import { Reservation } from '../../../src/reservations/entity'

describe('reservations.entity', () => {
	describe('isAvailableForReservation', () => {
		it.each([
			{ dateRangeStart: dayjs().add(7, 'day').set('hour', 23), result: true },
			{ dateRangeStart: dayjs().subtract(1, 'day'), result: true },
			{ dateRangeStart: dayjs(), result: true },
			{ dateRangeStart: dayjs().add(8, 'day'), result: false },
		])(
			'should handle reservation starting at $dateRangeStart and return $result',
			({ dateRangeStart, result }) => {
				const r = new Reservation({ dateRangeStart })
				expect(r.isAvailableForReservation()).toBe(result)
			},
		)
	})
})
