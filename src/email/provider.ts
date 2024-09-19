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

	public isConnected() {
		return this.emailClient.isConnected()
	}

	private async handleReceivedEmails(emails: Email[]) {
		await this.emailsQueue.addBulk(emails.map((email) => ({ data: email })))
	}

	public registerEmailListener() {
		this.emailClient.listen((emails) => this.handleReceivedEmails(emails))
	}

	public async readEmails(emails: Email[]) {
		await this.emailClient.markMailsSeen(emails.map((e) => e.id))
	}
}
