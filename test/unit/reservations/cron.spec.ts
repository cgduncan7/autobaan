import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'

import { LoggerModule } from '../../../src/logger/module'
import { LoggerService } from '../../../src/logger/service.logger'
import { NtfyModule } from '../../../src/ntfy/module'
import { NtfyProvider } from '../../../src/ntfy/provider'
import { ReservationsCronService } from '../../../src/reservations/cron'
import { Reservation } from '../../../src/reservations/entity'
import { ReservationsModule } from '../../../src/reservations/module'
import { ReservationsService } from '../../../src/reservations/service'
import { BaanReserverenService } from '../../../src/runner/baanreserveren/service'
import { RunnerModule } from '../../../src/runner/module'

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
				ConfigModule.forRoot({ isGlobal: true }),
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
			let performReservationSpy: jest.SpyInstance
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

				performReservationSpy = jest
					.spyOn(
						module.get<BaanReserverenService>(BaanReserverenService),
						'performReservation',
					)
					.mockResolvedValue()

				loggerSpy = jest
					.spyOn(module.get<LoggerService>(LoggerService), 'log')
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
				expect(performReservationSpy).toHaveBeenCalledWith(stubbedReservation)
			})
		})
	})
})
