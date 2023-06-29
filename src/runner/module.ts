import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'

import { LoggerModule } from '../logger/module'
import { BaanReserverenService } from './baanreserveren/service'
import { EmptyPageFactory } from './pages/empty'
import { RunnerService } from './service'

@Module({
	providers: [RunnerService, BaanReserverenService, EmptyPageFactory],
	imports: [LoggerModule, BullModule.registerQueue({ name: 'reservations' })],
	exports: [EmptyPageFactory, BaanReserverenService],
})
export class RunnerModule {}
