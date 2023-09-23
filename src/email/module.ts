import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'

import { LoggerModule } from '../logger/module'
import { EmailClient } from './client'
import { EMAILS_QUEUE_NAME } from './config'
import { EmailProvider } from './provider'

@Module({
	imports: [
		LoggerModule,
		BullModule.registerQueueAsync({ name: EMAILS_QUEUE_NAME }),
	],
	providers: [EmailClient, EmailProvider],
	exports: [EmailClient, EmailProvider],
})
export class EmailModule {}
