import { Inject, Injectable } from '@nestjs/common'

import { NtfyClient } from './client'
import { MessagePriority, MessageTags } from './types'

@Injectable()
export class NtfyProvider {
	constructor(
		@Inject(NtfyClient)
		private readonly ntfyClient: NtfyClient,
	) {}

	async sendErrorNotification(
		title: string,
		message: string,
		priority = MessagePriority.default,
	) {
		await this.ntfyClient.publish({
			title,
			message,
			tags: [MessageTags.red_x],
			priority,
		})
	}

	async sendInfoNotification(
		title: string,
		message: string,
		priority = MessagePriority.low,
	) {
		await this.ntfyClient.publish({
			title,
			message,
			tags: [MessageTags.info],
			priority,
		})
	}
}
