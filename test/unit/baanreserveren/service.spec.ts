import { getQueueToken } from '@nestjs/bull'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'

import dayjs from '../../../src/common/dayjs'
import { LoggerService } from '../../../src/logger/service.logger'
import { MONITORING_QUEUE_NAME } from '../../../src/monitoring/config'
import { Reservation } from '../../../src/reservations/entity'
import {
	BAAN_RESERVEREN_ROOT_URL,
	BaanReserverenService,
	CourtSlot,
} from '../../../src/runner/baanreserveren/service'
import { EmptyPage } from '../../../src/runner/pages/empty'

describe('baanreserveren.service', () => {
	let module: TestingModule
	let pageGotoSpy: jest.SpyInstance
	let brService: BaanReserverenService

	beforeAll(async () => {
		pageGotoSpy = jest
			.fn()
			.mockClear()
			.mockImplementation(() => Promise.resolve({ status: () => 200 }))
		module = await Test.createTestingModule({
			providers: [
				BaanReserverenService,
				{
					provide: ConfigService,
					useValue: { getOrThrow: jest.fn().mockReturnValue('test') },
				},
				{
					provide: LoggerService,
					useValue: { debug: jest.fn(), warn: jest.fn() },
				},
				{
					provide: EmptyPage,
					useValue: {
						waitForNetworkIdle: jest.fn().mockResolvedValue(null),
						waitForSelector: jest.fn().mockResolvedValue(undefined),
						goto: pageGotoSpy,
						url: jest
							.fn()
							.mockReturnValue({ includes: jest.fn().mockReturnValue(true) }),
						$: jest.fn().mockResolvedValue(undefined),
					},
				},
				{
					provide: getQueueToken(MONITORING_QUEUE_NAME),
					useValue: { add: jest.fn() },
				},
			],
		}).compile()
		brService = module.get<BaanReserverenService>(BaanReserverenService)
	})

	beforeEach(() => pageGotoSpy.mockClear())

	describe('performSpeedyReservation', () => {
		it.each([
			[18, 15, CourtSlot.Six, CourtSlot.Seven],
			[18, 30, CourtSlot.One, CourtSlot.Four],
			[18, 45, CourtSlot.Twelve, CourtSlot.Thirteen],
		])(
			'should try highest ranked court first',
			async (startHour, startMinute, preferredCourt, backupCourt) => {
				const start = dayjs()
					.set('hour', startHour)
					.set('minute', startMinute)
					.set('second', 0)
					.set('millisecond', 0)
				const reservation = new Reservation({
					id: '1',
					ownerId: '1',
					dateRangeStart: start,
					dateRangeEnd: start.add(45, 'minute'),
					opponents: [],
				})
				await brService.performSpeedyReservation(reservation)
				expect(pageGotoSpy).toHaveBeenCalledWith(
					`${BAAN_RESERVEREN_ROOT_URL}/reservations/make/${preferredCourt}/${
						start.valueOf() / 1000
					}`,
				)
				expect(pageGotoSpy).not.toHaveBeenCalledWith(
					`${BAAN_RESERVEREN_ROOT_URL}/reservations/make/${backupCourt}/${
						start.valueOf() / 1000
					}`,
				)
			},
		)

		it.each([
			[18, 15, CourtSlot.Six, CourtSlot.Seven],
			[18, 30, CourtSlot.One, CourtSlot.Four],
			[18, 45, CourtSlot.Twelve, CourtSlot.Thirteen],
		])(
			'should try backup if first rank is taken',
			async (startHour, startMinute, preferredCourt, backupCourt) => {
				pageGotoSpy.mockImplementation((url: string) => {
					if (
						url ===
						`${BAAN_RESERVEREN_ROOT_URL}/reservations/make/${preferredCourt}/${
							start.valueOf() / 1000
						}`
					) {
						return Promise.resolve({ status: () => 400 }) // fail on the preferred court
					}
					return Promise.resolve({ status: () => 200 })
				})
				const start = dayjs()
					.set('hour', startHour)
					.set('minute', startMinute)
					.set('second', 0)
					.set('millisecond', 0)
				const reservation = new Reservation({
					id: '1',
					ownerId: '1',
					dateRangeStart: start,
					dateRangeEnd: start.add(45, 'minute'),
					opponents: [],
				})
				await brService.performSpeedyReservation(reservation)
				expect(pageGotoSpy).toHaveBeenCalledWith(
					`${BAAN_RESERVEREN_ROOT_URL}/reservations/make/${preferredCourt}/${
						start.valueOf() / 1000
					}`,
				)
				expect(pageGotoSpy).toHaveBeenCalledWith(
					`${BAAN_RESERVEREN_ROOT_URL}/reservations/make/${backupCourt}/${
						start.valueOf() / 1000
					}`,
				)
			},
		)
	})
})
