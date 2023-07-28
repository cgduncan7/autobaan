import { Module } from '@nestjs/common'

import { LoggerModule } from '../logger/module'
import { EmailClient } from './client'
import { EmailProvider } from './provider'

@Module({
	providers: [EmailClient, EmailProvider],
	imports: [LoggerModule],
	exports: [EmailClient, EmailProvider],
})
export class EmailModule {}
