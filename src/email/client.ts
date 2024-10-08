import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as Imap from 'imap'
import { MailParser, ParsedEmail } from 'mailparser-mit'

import { LoggerService } from '../logger/service.logger'
import { NtfyProvider } from '../ntfy/provider'
import { Email } from './types'

const MAX_CONNECTION_ATTEMPTS = 5
const CONNECTION_ATTEMPT_DELAY = [0, 500, 1500, 5000, 1000]

export enum EmailClientStatus {
	NotReady,
	Ready,
	Destroying,
	Failed,
}

@Injectable()
export class EmailClient {
	public readonly imapClient: Imap
	private readonly mailboxName: string
	private mailbox?: Imap.Box
	private status: EmailClientStatus
	private connectionAttempts: number

	constructor(
		@Inject(LoggerService)
		private readonly loggerService: LoggerService,

		@Inject(NtfyProvider)
		private readonly ntfyProvider: NtfyProvider,

		@Inject(ConfigService)
		private readonly configService: ConfigService,
	) {
		this.connectionAttempts = 0
		this.mailboxName = this.configService.getOrThrow<string>('EMAIL_MAILBOX')
		this.imapClient = new Imap({
			host: this.configService.getOrThrow('EMAIL_HOST'),
			port: this.configService.get('EMAIL_PORT', 993),
			user: this.configService.getOrThrow('EMAIL_USER'),
			password: this.configService.getOrThrow('EMAIL_PASSWORD'),
			tls: true,
		})
		this.status = EmailClientStatus.NotReady
		this.setupDefaultListeners()
		this.connect()
	}

	onModuleDestroy() {
		this.setStatus(EmailClientStatus.Destroying)
		this.imapClient.end()
	}

	private setStatus(status: EmailClientStatus) {
		this.status = status
	}

	public isConnected() {
		return this.status === EmailClientStatus.Ready
	}

	private connect() {
		if (this.connectionAttempts > MAX_CONNECTION_ATTEMPTS) {
			this.setStatus(EmailClientStatus.Failed)
			return
		}

		if (this.connectionAttempts === 0) {
			this.imapClient.connect()
		} else {
			const connectionDelay = CONNECTION_ATTEMPT_DELAY[this.connectionAttempts]
			setTimeout(this.imapClient.connect, connectionDelay)
		}
		this.connectionAttempts += 1
	}

	private openBox() {
		this.imapClient.openBox(this.mailboxName, (error, mailbox) => {
			if (error) {
				this.loggerService.error('Error opening mailbox', {
					...error,
				})
				return
			}
			this.loggerService.debug('Mailbox opened', {
				mailbox: { name: mailbox.name },
			})
			this.mailbox = mailbox
		})
	}

	private attempt(
		label: string,
		current: number,
		max: number,
		delayMs: number,
		fn: () => unknown,
	) {
		if (current > max) {
			throw Error(`Max attempts reached for ${label}`)
		}
		this.loggerService.debug(`Attempting ${label} [${current} / ${max}]`)

		try {
			fn()
			this.loggerService.debug(`Attempt succeeded`)
		} catch (error: unknown) {
			this.loggerService.debug(
				`Attempting ${label} hit error at attempt ${current}`,
				error,
			)
			setTimeout(
				() => this.attempt(label, current + 1, max, delayMs, fn),
				delayMs,
			)
		}
	}

	private async handleNewMail(
		numMessages: number,
		callback: (emails: Email[]) => Promise<void>,
	) {
		this.loggerService.debug(`Received ${numMessages} emails`)
		const mailbox = await new Promise<Imap.Box>((res) => this.getMailbox(res))

		const {
			messages: { total: totalMessages, new: newMessages },
		} = mailbox

		this.loggerService.debug(
			`Total messages: ${totalMessages}; New messages: ${newMessages}; Received messages: ${numMessages}`,
		)

		if (newMessages > 0) {
			const emails = await this.fetchMailsFrom(
				totalMessages - (numMessages - 1),
			)
			this.loggerService.debug(`Fetched ${emails.length} emails`)
			await callback(emails)
		}
	}

	private _listen(callback: (emails: Email[]) => Promise<void>) {
		// Don't start listening until we are ready
		if (this.status === EmailClientStatus.NotReady) {
			throw new Error('Not ready to listen')
		}

		this.imapClient.on('mail', (n: number) => this.handleNewMail(n, callback))
	}

	public listen(callback: (emails: Email[]) => Promise<void>) {
		this.attempt('listen', 0, 5, 1000, () => {
			this._listen(callback)
		})
	}

	private _getMailbox() {
		if (this.mailbox == null) {
			throw new Error('Mailbox not ready')
		}
		return this.mailbox
	}

	public getMailbox(callback: (mailbox: Imap.Box) => void) {
		this.attempt('getMailbox', 0, 5, 200, () => {
			const mailbox = this._getMailbox()
			callback(mailbox)
		})
	}

	private async generateEmail(msg: Imap.ImapMessage): Promise<Email> {
		return new Promise((res, rej) => {
			const mailParser = new MailParser({ defaultCharset: 'utf-8' })
			let id: string
			msg.on('body', async (stream) => {
				try {
					stream.pipe(mailParser)
				} catch (error: unknown) {
					rej(error)
				}
			})

			msg.on('attributes', (attr) => {
				id = `${attr.uid}`
			})

			msg.on('error', (error: Error) => rej(error))

			mailParser.on('error', (error: Error) => rej(error))

			mailParser.on('end', (mail: ParsedEmail) => {
				const { from = [], subject = '', text = '' } = mail
				const fromString = from
					.map(({ address, name }) => `${name} <${address}>`)
					.join(';')
				res({
					id,
					from: fromString,
					subject,
					text,
				})
			})
		})
	}

	public async fetchMailsFrom(startingMessageSeqNo: number) {
		this.loggerService.debug(
			`Fetching mails starting from ${startingMessageSeqNo}`,
		)
		const fetcher = this.imapClient.seq.fetch(`${startingMessageSeqNo}:*`, {
			bodies: '',
		})

		return new Promise<Email[]>((res, rej) => {
			const generateEmailPromises: Promise<Email>[] = []
			fetcher.on('message', (msg: Imap.ImapMessage) => {
				generateEmailPromises.push(this.generateEmail(msg))
			})

			fetcher.on('error', (error) => rej(error))

			fetcher.on('end', async () => {
				const emails = await Promise.all(generateEmailPromises)
				res(emails)
			})
		})
	}

	public async markMailsSeen(messageIds: string[]) {
		this.loggerService.debug(`Marking mails as seen (${messageIds.join(',')})`)
		return new Promise<void>((res, rej) => {
			this.imapClient.addFlags(messageIds.join(','), ['\\Seen'], (error) => {
				if (error != null) {
					rej(error)
				}
				res()
			})
		})
	}

	private setupDefaultListeners() {
		this.imapClient.on('ready', () => {
			this.loggerService.debug('email client ready')
			this.connectionAttempts = 0
			if (this.status === EmailClientStatus.NotReady) {
				this.setStatus(EmailClientStatus.Ready)
				this.openBox()
			}
		})

		this.imapClient.on('close', () => {
			if (this.status === EmailClientStatus.Destroying) {
				this.loggerService.debug('email client close due to termination')
				return
			}

			this.loggerService.debug('email client reconnecting')
			this.setStatus(EmailClientStatus.NotReady)
			this.connect()
		})

		this.imapClient.on('error', async (error: Error) => {
			this.loggerService.error(`Error with imap client ${error.message}`)
			await this.ntfyProvider.sendEmailClientErrorNotification(error.message)
			this.setStatus(EmailClientStatus.NotReady)
		})
	}

	public addCustomListener(
		eventName: string,
		listener: (...args: any[]) => void,
	) {
		this.imapClient.on(eventName, listener)
	}

	public removeCustomListener(
		eventName: string,
		listener: (...args: any[]) => void,
	) {
		this.imapClient.off(eventName, listener)
	}
}
