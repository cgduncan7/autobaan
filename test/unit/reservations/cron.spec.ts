import { getQueueToken } from '@nestjs/bull'
import { Test, TestingModule } from '@nestjs/testing'
import { Dayjs } from 'dayjs'

import dayjs from '../../../src/common/dayjs'
import { LoggerService } from '../../../src/logger/service.logger'
import { NtfyProvider } from '../../../src/ntfy/provider'
import {
	RESERVATIONS_QUEUE_NAME,
	ReservationsQueue,
} from '../../../src/reservations/config'
import {
	DAILY_RESERVATIONS_ATTEMPTS,
	ReservationsCronService,
} from '../../../src/reservations/cron'
import { ReservationsService } from '../../../src/reservations/service'
import { BaanReserverenService } from '../../../src/runner/baanreserveren/service'

describe('reservations.cron', () => {
	let module: TestingModule
	let cronService: ReservationsCronService

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ReservationsCronService,
				{ provide: BaanReserverenService, useValue: { warmup: jest.fn() } },
				{ provide: LoggerService, useValue: { debug: jest.fn() } },
				{
					provide: getQueueToken(RESERVATIONS_QUEUE_NAME),
					useValue: { addBulk: jest.fn(), process: jest.fn() },
				},
				{
					provide: ReservationsService,
					useValue: { getSchedulable: jest.fn() },
				},
				{
					provide: NtfyProvider,
					useValue: {
						sendCronStartNotification: jest.fn(),
						sendCronStopNotification: jest.fn(),
					},
				},
			],
		}).compile()

		cronService = module.get<ReservationsCronService>(ReservationsCronService)
	})

	afterAll(async () => {
		await module.close()
	})

	describe('handleDailyReservations', () => {
		describe('has scheduleable reservations', () => {
			const stubbedReservation = { id: 'abc-123' }
			let warmupSpy: jest.SpyInstance
			let reservationsQueueSpy: jest.SpyInstance
			let loggerSpy: jest.SpyInstance
			const loggerInvocationDates: { msg: string; timestamp: Dayjs }[] = []

			beforeAll(async () => {
				jest
					.spyOn(
						module.get<ReservationsService>(ReservationsService),
						'getSchedulable',
					)
					// @ts-expect-error stubbed reservation
					.mockResolvedValue([stubbedReservation])

				warmupSpy = jest
					.spyOn(
						module.get<BaanReserverenService>(BaanReserverenService),
						'warmup',
					)
					.mockReturnValue(new Promise((res) => setTimeout(res, 1000)))

				reservationsQueueSpy = jest
					.spyOn(
						module.get<ReservationsQueue>(
							getQueueToken(RESERVATIONS_QUEUE_NAME),
						),
						'addBulk',
					)
					.mockResolvedValue([]) // unused so empty array

				loggerSpy = jest
					.spyOn(module.get<LoggerService>(LoggerService), 'debug')
					.mockImplementation((msg: string) => {
						loggerInvocationDates.push({ msg, timestamp: dayjs() })
					})

				jest
					.useFakeTimers({ advanceTimers: true })
					.setSystemTime(new Date('2024-01-01T06:59:58.050+01:00'))

				await cronService.handleDailyReservations()
			})

			afterAll(() => {
				jest.useRealTimers()
			})

			it('should perform warmup', () => {
				expect(warmupSpy).toHaveBeenCalledTimes(1)
			})

			it('should wait until 7am', () => {
				expect(loggerSpy).toHaveBeenCalledTimes(5)
				const { timestamp: goTimeInvocation } =
					loggerInvocationDates.find(({ msg }) => msg === `It's go-time`) ?? {}
				expect(goTimeInvocation).toBeDefined()
				expect(goTimeInvocation?.get('milliseconds')).toBeLessThanOrEqual(100)
				expect(goTimeInvocation?.get('seconds')).toEqual(0)
				expect(goTimeInvocation?.get('minutes')).toEqual(0)
				expect(goTimeInvocation?.get('hours')).toEqual(7)
			})

			it('should perform reservations', () => {
				expect(reservationsQueueSpy).toHaveBeenCalledWith([
					{
						data: stubbedReservation,
						opts: { attempts: DAILY_RESERVATIONS_ATTEMPTS },
					},
				])
			})
		})
	})
})
