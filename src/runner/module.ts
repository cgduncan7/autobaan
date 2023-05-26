import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { EmptyPageFactory } from './pages/empty'
import { RunnerService } from './service'
import { BaanReserverenService } from './baanreserveren/service'
import { LoggerModule } from '../logger/module'

@Module({
  providers: [RunnerService, BaanReserverenService, EmptyPageFactory],
  imports: [LoggerModule, BullModule.registerQueue({ name: 'reservations' })],
  exports: [EmptyPageFactory, BaanReserverenService],
})

export class RunnerModule {}