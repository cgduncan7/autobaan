import { InjectQueue, Process, Processor } from '@nestjs/bull'
import { Inject, Injectable } from '@nestjs/common'
import { Job, JobOptions, Queue } from 'bull'
import { Dayjs } from 'dayjs'

import { NtfyClient } from './client'
import {
	MessageConfig,
	MessagePriority,
	MessageTags,
	NTFY_PUBLISH_QUEUE_NAME,
} from './types'

@Processor(NTFY_PUBLISH_QUEUE_NAME)
@Injectable()
export class NtfyProvider {
	constructor(
		@Inject(NtfyClient)
		private readonly ntfyClient: NtfyClient,

		@InjectQueue(NTFY_PUBLISH_QUEUE_NAME)
		private readonly publishQueue: Queue,
	) {}

	@Process()
	async handlePublishJob(job: Job<Omit<MessageConfig, 'topic'>>) {
		await this.ntfyClient.publish({
			...job.data,
		})
	}

	private static defaultJob(
		data: Omit<MessageConfig, 'topic'>,
	): [Omit<MessageConfig, 'topic'>, JobOptions] {
		return [
			data,
			{
				attempts: 3,
				removeOnComplete: true,
				backoff: {
					type: 'exponential',
				},
			},
		]
	}

	async sendCronStartNotification(title: string) {
		await this.publishQueue.add(
			...NtfyProvider.defaultJob({
				title,
				tags: [MessageTags.alarm_clock, MessageTags.green_circle],
			}),
		)
	}

	async sendCronStopNotification(title: string, message: string) {
		await this.publishQueue.add(
			...NtfyProvider.defaultJob({
				title,
				message,
				tags: [MessageTags.alarm_clock, MessageTags.red_circle],
			}),
		)
	}

	async sendPerformingReservationNotification(
		reservationId: string,
		startTime: Dayjs,
		endTime: Dayjs,
	) {
		await this.publishQueue.add(
			...NtfyProvider.defaultJob({
				title: 'Performing reservation',
				message: `${reservationId} - ${startTime.format()} to ${endTime.format()}`,
				tags: [MessageTags.badminton],
				priority: MessagePriority.low,
			}),
		)
	}

	async sendErrorPerformingReservationNotification(
		reservationId: string,
		startTime: Dayjs,
		endTime: Dayjs,
		error: Error,
	) {
		await this.publishQueue.add(
			...NtfyProvider.defaultJob({
				title: 'Error performing reservation',
				message: `${reservationId} - ${startTime.format()} to ${endTime.format()} : (${
					error.name
				}) - ${error.message}`,
				tags: [MessageTags.badminton, MessageTags.red_x],
				priority: MessagePriority.low,
			}),
		)
	}

	async sendReservationWaitlistedNotification(
		reservationId: string,
		startTime: Dayjs,
		endTime: Dayjs,
	) {
		await this.publishQueue.add(
			...NtfyProvider.defaultJob({
				title: 'Reservation waitlisted',
				message: `${reservationId} - ${startTime.format()} to ${endTime.format()}`,
				tags: [MessageTags.badminton, MessageTags.hourglass],
				priority: MessagePriority.low,
			}),
		)
	}
}
