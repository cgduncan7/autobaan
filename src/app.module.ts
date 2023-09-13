import { BullModule } from '@nestjs/bull'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { TypeOrmModule } from '@nestjs/typeorm'
import { resolve } from 'path'

import { EmailModule } from './email/module'
import { LoggerMiddleware } from './logger/middleware'
import { LoggerModule } from './logger/module'
import { DatabaseLoggerService } from './logger/service.database_logger'
import { NtfyModule } from './ntfy/module'
import { RecurringReservationsModule } from './recurringReservations/module'
import { ReservationsModule } from './reservations/module'
import { RunnerModule } from './runner/module'
import { WaitingListModule } from './waitingList/module'

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule, LoggerModule],
			inject: [ConfigService, DatabaseLoggerService],
			useFactory: (
				configService: ConfigService,
				databaseLoggerService: DatabaseLoggerService,
			) => ({
				type: 'sqlite',
				database: configService.get<string>(
					'DATABASE',
					resolve('./db/autobaan_db'),
				),
				migrations: [],
				autoLoadEntities: true,
				logging: true,
				logger: databaseLoggerService,
			}),
		}),
		BullModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				redis: {
					host: configService.getOrThrow<string>('REDIS_HOST'),
					port: configService.getOrThrow<number>('REDIS_PORT'),
				},
				defaultJobOptions: {
					removeOnComplete: true,
				},
			}),
		}),
		ScheduleModule.forRoot(),
		ReservationsModule,
		RecurringReservationsModule,
		RunnerModule,
		LoggerModule,
		EmailModule,
		WaitingListModule,
		NtfyModule,
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggerMiddleware).forRoutes('*')
	}
}
