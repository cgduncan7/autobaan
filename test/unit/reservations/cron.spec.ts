import { getQueueToken } from '@nestjs/bull'
import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'

import { LoggerModule } from '../../../src/logger/module'
import { LoggerService } from '../../../src/logger/service.logger'
import { NtfyModule } from '../../../src/ntfy/module'
import { NtfyProvider } from '../../../src/ntfy/provider'
import {
	RESERVATIONS_QUEUE_NAME,
	ReservationsQueue,
} from '../../../src/reservations/config'
import {
	DAILY_RESERVATIONS_ATTEMPTS,
	ReservationsCronService,
} from '../../../src/reservations/cron'
import { Reservation } from '../../../src/reservations/entity'
import { ReservationsModule } from '../../../src/reservations/module'
import { ReservationsService } from '../../../src/reservations/service'
import { BaanReserverenService } from '../../../src/runner/baanreserveren/service'
import { RunnerModule } from '../../../src/runner/module'
import config from '../../config'

describe('reservations.cron', () => {
	let module: TestingModule
	let cronService: ReservationsCronService

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				ReservationsModule,
				RunnerModule,
				NtfyModule,
				LoggerModule,
				ConfigModule.forRoot({
					isGlobal: true,
					ignoreEnvFile: true,
					ignoreEnvVars: true,
					load: [() => config],
				}),
				TypeOrmModule.forRoot({
					type: 'sqlite',
					database: ':memory:',
					entities: [Reservation],
				}),
			],
		}).compile()

		cronService = module.get<ReservationsCronService>(ReservationsCronService)
	})

	afterAll(async () => {
		await module.close()
	})

	describe('handleDailyReservations', () => {
		beforeEach(() => {
			jest.spyOn(
				module.get<NtfyProvider>(NtfyProvider),
				'sendCronStartNotification',
			)
			jest.spyOn(
				module.get<NtfyProvider>(NtfyProvider),
				'sendCronStopNotification',
			)
		})

		describe('has scheduleable reservations', () => {
			const stubbedReservation = { id: 'abc-123' }
			let warmupSpy: jest.SpyInstance
			let reservationsQueueSpy: jest.SpyInstance
			let loggerSpy: jest.SpyInstance
			const loggerInvocationDates: { msg: string; timestamp: Date }[] = []

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
						loggerInvocationDates.push({ msg, timestamp: new Date() })
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
				expect(goTimeInvocation?.getHours()).toEqual(7)
				expect(goTimeInvocation?.getSeconds()).toEqual(0)
				expect(goTimeInvocation?.getMilliseconds()).toBeLessThanOrEqual(100)
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
