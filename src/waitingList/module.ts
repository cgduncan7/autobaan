import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'

import { EMAILS_QUEUE_NAME } from '../email/config'
import { EmailModule } from '../email/module'
import { LoggerModule } from '../logger/module'
import { NtfyModule } from '../ntfy/module'
import { RESERVATIONS_QUEUE_NAME } from '../reservations/config'
import { ReservationsModule } from '../reservations/module'
import { WaitingListService } from './service'

@Module({
	imports: [
		LoggerModule,
		ReservationsModule,
		BullModule.registerQueueAsync({ name: EMAILS_QUEUE_NAME }),
		BullModule.registerQueueAsync({ name: RESERVATIONS_QUEUE_NAME }),
		EmailModule,
		NtfyModule,
	],
	providers: [WaitingListService],
	exports: [WaitingListService],
})
export class WaitingListModule {}
