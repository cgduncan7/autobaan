import { BullModule } from '@nestjs/bull'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { TypeOrmModule } from '@nestjs/typeorm'
import { resolve } from 'path'
import { ReservationsModule } from './reservations/module'
import { RunnerModule } from './runner/module'
import { ConfigModule } from '@nestjs/config'
import { LoggerMiddleware } from './logger/middleware'
import { LoggerModule } from './logger/module'

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'sqlite',
			database: resolve('./db/autobaan_db'),
			autoLoadEntities: true,
			logging: true,
			synchronize: true,
		}),
		BullModule.forRoot({
			redis: {
				host: process.env.REDIS_HOST,
				port: Number.parseInt(process.env.REDIS_PORT || '6379'),
			},
			defaultJobOptions: {
				removeOnComplete: true,
			}
		}),
		ScheduleModule.forRoot(),
		ConfigModule.forRoot({ isGlobal: true }),
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
