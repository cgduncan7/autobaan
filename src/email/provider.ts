import { Inject, Injectable } from '@nestjs/common'
import { Box } from 'imap'

import { LoggerService } from '../logger/service'
import { EmailClient } from './client'
import { Email } from './types'

@Injectable()
export class EmailProvider {
	constructor(
		@Inject(EmailClient)
		private readonly emailClient: EmailClient,

		@Inject(LoggerService)
		private readonly loggerService: LoggerService,
	) {
		this.registerEmailListener()
	}

	private async handleReceivedEmails(emails: Email[]) {
		this.loggerService.debug(JSON.stringify(emails))
	}

	public registerEmailListener() {
		this.emailClient.listen((emails) => this.handleReceivedEmails(emails))
	}
}
