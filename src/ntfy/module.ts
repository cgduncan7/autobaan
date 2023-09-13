import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'

import { LoggerModule } from '../logger/module'
import { NtfyClient } from './client'
import { NtfyProvider } from './provider'
import { NTFY_PUBLISH_QUEUE_NAME } from './types'

@Module({
	imports: [
		BullModule.registerQueue({ name: NTFY_PUBLISH_QUEUE_NAME }),
		LoggerModule,
	],
	providers: [NtfyProvider, NtfyClient],
	exports: [NtfyProvider, NtfyClient],
})
export class NtfyModule {}
