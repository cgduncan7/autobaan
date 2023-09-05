import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { EmailModule } from 'src/email/module'
import { ReservationsModule } from 'src/reservations/module'

import { EMAILS_QUEUE_NAME } from '../email/config'
import { LoggerModule } from '../logger/module'
import { RESERVATIONS_QUEUE_NAME } from '../reservations/config'
import { WaitingListService } from './service'

@Module({
	imports: [
		LoggerModule,
		ReservationsModule,
		BullModule.registerQueue({ name: EMAILS_QUEUE_NAME }),
		BullModule.registerQueue({ name: RESERVATIONS_QUEUE_NAME }),
		EmailModule,
	],
	providers: [WaitingListService],
	exports: [WaitingListService],
})
export class WaitingListModule {}
