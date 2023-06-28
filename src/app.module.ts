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
			inject: [ConfigService],
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
		RunnerModule,
		LoggerModule,
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggerMiddleware).forRoutes('*')
	}
}
