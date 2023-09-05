import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Axios } from 'axios'

import { MessageConfig } from './types'

@Injectable()
export class NtfyClient {
	private readonly httpClient: Axios
	private readonly topic: string
	constructor(
		@Inject(ConfigService)
		private readonly configService: ConfigService,
	) {
		const host = this.configService.getOrThrow<string>('NTFY_HOST')
		this.topic = this.configService.getOrThrow<string>('NTFY_TOPIC')
		this.httpClient = new Axios({
			baseURL: `https://${host}`,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	}

	async publish(message: Omit<MessageConfig, 'topic'>) {
		return await this.httpClient.post(
			'/',
			JSON.stringify({
				topic: this.topic,
				...message,
			}),
		)
	}
}
