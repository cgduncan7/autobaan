import { InjectQueue, Process, Processor } from '@nestjs/bull'
import { Inject } from '@nestjs/common'
import { Job, Queue } from 'bull'
import { ReservationsService } from 'src/reservations/service'

import dayjs from '../common/dayjs'
import { EMAILS_QUEUE_NAME } from '../email/config'
import { Email } from '../email/types'
import { LoggerService } from '../logger/service.logger'
import { RESERVATIONS_QUEUE_NAME } from '../reservations/config'
import { WaitingListDetails } from './types'

const EMAIL_SUBJECT_REGEX = new RegExp(
	/^personal waitinglist reservation free at/i,
)
const EMAIL_ADDRESS = 'Squash City <no-reply@i-reservations.nl>'
const EMAIL_DATE_REGEX = new RegExp(
	/^Datum: ([0-9]{1,2}-[0-9]{1,2}-[0,9]{4})$/im,
)
const EMAIL_START_TIME_REGEX = new RegExp(
	/^Begintijd: ([0-9]{1,2}:[0-9]{1,2})$/im,
)
const EMAIL_END_TIME_REGEX = new RegExp(/^Eindtijd: ([0-9]{1,2}:[0-9]{1,2})$/im)

@Processor(EMAILS_QUEUE_NAME)
export class WaitingListService {
	constructor(
		@InjectQueue(RESERVATIONS_QUEUE_NAME)
		private readonly reservationsQueue: Queue,

		@Inject(ReservationsService)
		private readonly reservationsService: ReservationsService,

		@Inject(LoggerService)
		private readonly loggerService: LoggerService,
	) {}

	@Process()
	async processEmail(job: Job<Email>) {
		const { data: email } = job
		this.loggerService.log('Handling email', {
			id: email.id,
			from: email.from,
			subject: email.subject,
		})

		if (!this.isRelevantEmail) return

		await this.handleWaitingListEmail(email)
	}

	private async handleWaitingListEmail(email: Email) {
		const { date, startTime } = this.getWaitingListDetails(email)
		const dateRangeStart = dayjs(`${date} ${startTime}`)
		const reservations = await this.reservationsService.getByDateOnWaitingList(
			dateRangeStart,
		)

		if (reservations.length) {
			this.loggerService.error('Found no reservations on waiting list')
			return
		}

		this.loggerService.log(
			`Found ${reservations.length} reservations on waiting list`,
		)

		await this.reservationsQueue.addBulk(
			reservations.map((r) => ({ data: r, opts: { attempts: 1 } })),
		)
	}

	private getWaitingListDetails(email: Email): WaitingListDetails {
		const dateResult = EMAIL_DATE_REGEX.exec(email.text)
		const startTimeResult = EMAIL_START_TIME_REGEX.exec(email.text)
		const endTimeResult = EMAIL_END_TIME_REGEX.exec(email.text)

		if (dateResult == null || dateResult[1] == null) {
			throw new WaitingListDetailsError('Date not found')
		}

		if (startTimeResult == null || startTimeResult[1] == null) {
			throw new WaitingListDetailsError('Start time not found')
		}

		if (endTimeResult == null || endTimeResult[1] == null) {
			throw new WaitingListDetailsError('End time not found')
		}

		return {
			date: dateResult[1],
			startTime: startTimeResult[1],
			endTime: endTimeResult[1],
		}
	}

	private isRelevantEmail(email: Email): boolean {
		if (!EMAIL_SUBJECT_REGEX.test(email.subject)) {
			this.loggerService.log('Ignoring email, irrelevant subject', {
				id: email.id,
				subject: email.subject,
			})
			return false
		}

		if (EMAIL_ADDRESS !== email.from) {
			this.loggerService.log('Ignoring email, irrelevant sender', {
				id: email.id,
				sender: email.from,
			})
			return false
		}

		return true
	}
}

export class WaitingListDetailsError extends Error {}