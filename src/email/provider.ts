import { InjectQueue } from '@nestjs/bull'
import { Inject, Injectable } from '@nestjs/common'
import { Queue } from 'bull'

import { EmailClient } from './client'
import { EMAILS_QUEUE_NAME } from './config'
import { Email } from './types'

@Injectable()
export class EmailProvider {
	constructor(
		@Inject(EmailClient)
		private readonly emailClient: EmailClient,

		@InjectQueue(EMAILS_QUEUE_NAME)
		private readonly emailsQueue: Queue,
	) {
		this.registerEmailListener()
	}

	private async handleReceivedEmails(emails: Email[]) {
		this.emailsQueue.addBulk(
			emails.map((email) => ({ name: email.id, data: email })),
		)
	}

	public registerEmailListener() {
		this.emailClient.listen((emails) => this.handleReceivedEmails(emails))
	}
}
