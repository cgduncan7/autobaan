import { BullModule } from '@nestjs/bull'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { TypeOrmModule } from '@nestjs/typeorm'
import { resolve } from 'path'
import { ReservationsModule } from './reservations/module'
import { RunnerModule } from './runner/module'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { LoggerMiddleware } from './logger/middleware'
import { LoggerModule } from './logger/module'

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				type: 'sqlite',
				database: configService.get<string>(
					'DATABASE',
					resolve('./db/autobaan_db'),
				),
				migrations: [
					configService.get<string>(
						'DATABASE_MIGRATIONS',
						resolve('./database/migrations/*.ts'),
					),
				],
				autoLoadEntities: true,
				logging: true,
			}),
		}),
		BullModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				redis: {
					host: configService.get<string>('REDIS_HOST', 'localhost'),
					port: configService.get<number>('REDIS_PORT', 6379),
				},
				defaultJobOptions: {
					removeOnComplete: true,
				},
			}),
		}),
		ScheduleModule.forRoot(),
		ReservationsModule,
		RunnerModule,
		LoggerModule,
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggerMiddleware).forRoutes('*')
	}
}
