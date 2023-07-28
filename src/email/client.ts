import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Dayjs } from 'dayjs'
import * as Imap from 'imap'

import dayjs from '../common/dayjs'
import { LoggerService } from '../logger/service'
import { Email } from './types'

export enum EmailClientStatus {
	NotReady,
	Ready,
}

@Injectable()
export class EmailClient {
	public readonly imapClient: Imap
	private mailbox?: Imap.Box
	private status: EmailClientStatus

	constructor(
		@Inject(LoggerService)
		private readonly loggerService: LoggerService,

		@Inject(ConfigService)
		private readonly configService: ConfigService,
	) {
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
		this.imapClient.end()
	}

	private setStatus(status: EmailClientStatus) {
		this.status = status
	}

	public connect() {
		this.imapClient.connect()
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
		this.loggerService.log(`Attempting ${label} [${current} / ${max}]`)

		try {
			fn()
		} catch (error: unknown) {
			this.loggerService.warn(
				`Attempting ${label} hit error at attempt ${current}`,
			)
			setTimeout(
				() => this.attempt(label, current + 1, max, delayMs, fn),
				delayMs,
			)
		}
	}

	private async handleNewMail(
		numMessages: number,
		callback: (emails: Email[]) => void,
	) {
		this.loggerService.log(`Received ${numMessages} emails`)
		const mailbox = await new Promise<Imap.Box>((res) => this.getMailbox(res))

		const {
			messages: { total: totalMessages, new: newMessages },
		} = mailbox

		if (newMessages > 0) {
			const startingMessage = totalMessages - newMessages + 1 // starting message is inclusive
			const emails = await this.fetchMails(`${startingMessage}`, '*')
			callback(emails)
		}
	}

	private _listen(callback: (emails: Email[]) => void) {
		// Don't start listening until we are ready
		if (this.status === EmailClientStatus.NotReady) {
			throw new Error('Not ready to listen')
		}

		const mailbox = this.configService.get<string>('EMAIL_MAILBOX', 'INBOX')
		this.imapClient.openBox(mailbox, (error, mailbox) => {
			if (error) {
				this.loggerService.error('Error opening mailbox', {
					...error,
				})
				return
			}
			this.mailbox = mailbox
		})

		this.imapClient.on('mail', (n: number) => this.handleNewMail(n, callback))
	}

	public listen(callback: (emails: Email[]) => void) {
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

	private async generateEmailBody(
		stream: NodeJS.ReadableStream,
	): Promise<Buffer> {
		return new Promise<Buffer>((res, rej) => {
			const bufferData: any[] = []
			stream.on('data', (chunk) => {
				bufferData.push(chunk)
			})
			stream.on('end', () => {
				res(Buffer.concat(bufferData))
			})
			stream.on('error', (error: Error) => rej(error))
		})
	}

	private async generateEmail(msg: Imap.ImapMessage): Promise<Email> {
		return new Promise((res, rej) => {
			let id: number
			let date: Dayjs
			let bodyPromise: Promise<Buffer>
			msg.on('body', async (stream) => {
				try {
					bodyPromise = this.generateEmailBody(stream)
				} catch (error: unknown) {
					rej(error)
				}
			})

			msg.on('attributes', (attr) => {
				id = attr.uid
				date = dayjs(attr.date)
			})

			msg.on('error', (error: Error) => rej(error))

			msg.on('end', async () => {
				const body = (await bodyPromise).toString()
				res({
					id,
					date,
					body,
				})
			})
		})
	}

	public async fetchMails(startingMessageId: string, endingMessageId: string) {
		this.loggerService.debug(
			`Fetching mails ${startingMessageId}:${endingMessageId}`,
		)
		const fetcher = this.imapClient.fetch(
			`${startingMessageId}:${endingMessageId}`,
			{
				bodies: '',
				struct: true,
			},
		)

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

	private setupDefaultListeners() {
		this.imapClient.on('ready', () => {
			this.loggerService.debug('email client ready')
			this.setStatus(EmailClientStatus.Ready)
		})

		this.imapClient.on('close', () => {
			this.loggerService.debug('email client close')
			this.setStatus(EmailClientStatus.NotReady)
		})

		this.imapClient.on('end', () => {
			this.loggerService.debug('email client end')
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
