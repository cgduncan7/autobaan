import { Module } from '@nestjs/common'

import { NtfyClient } from './client'
import { NtfyProvider } from './provider'

@Module({
	providers: [NtfyProvider, NtfyClient],
	exports: [NtfyProvider, NtfyClient],
})
export class NtfyModule {}
