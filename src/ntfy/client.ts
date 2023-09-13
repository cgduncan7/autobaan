import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Axios } from 'axios'

import { LoggerService } from '../logger/service.logger'
import { MessageConfig } from './types'

@Injectable()
export class NtfyClient {
	private readonly httpClient: Axios
	private readonly topic: string
	constructor(
		@Inject(ConfigService)
		private readonly configService: ConfigService,

		@Inject(LoggerService)
		private readonly loggerService: LoggerService,
	) {
		const host = this.configService.getOrThrow<string>('NTFY_HOST')
		this.topic = this.configService.getOrThrow<string>('NTFY_TOPIC')
		const token = this.configService.getOrThrow<string>('NTFY_TOKEN')
		this.httpClient = new Axios({
			baseURL: `https://${host}`,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
		})
	}

	async publish(message: Omit<MessageConfig, 'topic'>) {
		try {
			await this.httpClient.post(
				'/',
				JSON.stringify({
					topic: this.topic,
					...message,
				}),
			)
		} catch (error: unknown) {
			this.loggerService.error('ntfy client failed', { error })
		}
	}
}
