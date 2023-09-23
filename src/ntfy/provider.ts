import { InjectQueue, Process, Processor } from '@nestjs/bull'
import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Job, JobOptions, Queue } from 'bull'
import { Dayjs } from 'dayjs'

import { NtfyClient } from './client'
import { MessageConfig, MessageTags, NTFY_PUBLISH_QUEUE_NAME } from './types'

@Processor(NTFY_PUBLISH_QUEUE_NAME)
@Injectable()
export class NtfyProvider implements OnApplicationBootstrap {
	constructor(
		@Inject(ConfigService)
		private readonly configService: ConfigService,

		@Inject(NtfyClient)
		private readonly ntfyClient: NtfyClient,

		@InjectQueue(NTFY_PUBLISH_QUEUE_NAME)
		private readonly publishQueue: Queue,
	) {}

	async onApplicationBootstrap() {
		await this.sendBootstrappedNotification()
	}

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

	async sendBootstrappedNotification() {
		const gitCommit = this.configService.get<string>('GIT_COMMIT')
		await this.publishQueue.add(
			...NtfyProvider.defaultJob({
				title: 'Autobaan up and running',
				message: `Version ${gitCommit}`,
				tags: [MessageTags.badminton],
			}),
		)
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
			}),
		)
	}

	async sendWaitListEmailReceivedNotification(subject: string) {
		await this.publishQueue.add(
			...NtfyProvider.defaultJob({
				title: 'Wait listed reservation available',
				message: `${subject}`,
				tags: [MessageTags.badminton, MessageTags.hourglass],
			}),
		)
	}
}
