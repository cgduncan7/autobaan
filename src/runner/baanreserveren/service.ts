import { Inject, Injectable } from '@nestjs/common'
import { instanceToPlain } from 'class-transformer'
import { Dayjs } from 'dayjs'
import { ElementHandle, Page } from 'puppeteer'
import { LoggerService } from 'src/logger/service.logger'

import dayjs from '../../common/dayjs'
import { Reservation } from '../../reservations/entity'
import { EmptyPage } from '../pages/empty'

const BAAN_RESERVEREN_ROOT_URL = 'https://squashcity.baanreserveren.nl'

export enum BaanReserverenUrls {
	Reservations = '/reservations',
	Logout = '/auth/logout',
	WaitingList = '/waitinglist',
	WaitingListAdd = '/waitinglist/add',
}

enum SessionAction {
	NoAction,
	Logout,
	Login,
}

interface BaanReserverenSession {
	username: string
	startedAt: Dayjs
}

const MIN_TYPING_DELAY_MS = 10
const MAX_TYPING_DELAY_MS = 30

@Injectable()
export class BaanReserverenService {
	private session: BaanReserverenSession | null = null

	constructor(
		@Inject(LoggerService)
		private readonly loggerService: LoggerService,

		@Inject(EmptyPage)
		private readonly page: Page,
	) {}

	// tryna be sneaky
	private getTypingDelay() {
		return (
			(MAX_TYPING_DELAY_MS - MIN_TYPING_DELAY_MS) * Math.random() +
			MIN_TYPING_DELAY_MS
		)
	}

	private async checkSession(username: string) {
		this.loggerService.debug('Checking session', {
			username,
			session: this.session,
		})
		if (this.page.url().includes(BAAN_RESERVEREN_ROOT_URL)) {
			// Check session by going to /reservations to see if we are still logged in via cookies
			await this.navigateToReservations()
			if (this.page.url().includes('?reason=LOGGED_IN')) {
				return SessionAction.Login
			}

			return this.session?.username !== username
				? SessionAction.Logout
				: SessionAction.NoAction
		}
		return SessionAction.Login
	}

	private startSession(username: string) {
		this.loggerService.debug('Starting session', { username })
		if (this.session && this.session.username !== username) {
			throw new Error('Session already started')
		}

		if (this.session?.username === username) {
			return
		}

		this.session = {
			username,
			startedAt: dayjs(),
		}
	}

	private endSession() {
		this.loggerService.debug('Ending session', { session: this.session })
		this.session = null
	}

	private async login(username: string, password: string) {
		this.loggerService.debug('Logging in', { username })
		await this.page
			.waitForSelector('input[name=username]')
			.then((i) => i?.type(username, { delay: this.getTypingDelay() }))
			.catch((e: Error) => {
				throw new RunnerLoginUsernameInputError(e)
			})
		await this.page
			.$('input[name=password]')
			.then((i) => i?.type(password, { delay: this.getTypingDelay() }))
			.catch((e: Error) => {
				throw new RunnerLoginPasswordInputError(e)
			})
		await this.page
			.$('button')
			.then((b) => b?.click())
			.catch((e: Error) => {
				throw new RunnerLoginSubmitError(e)
			})
		this.startSession(username)
	}

	private async logout() {
		this.loggerService.debug('Logging out')
		await this.page.goto(
			`${BAAN_RESERVEREN_ROOT_URL}/${BaanReserverenUrls.Logout}`,
		)
		this.endSession()
	}

	private async init(reservation: Reservation) {
		this.loggerService.debug('Initializing', {
			reservation: instanceToPlain(reservation),
		})
		await this.page.goto(BAAN_RESERVEREN_ROOT_URL)
		const action = await this.checkSession(reservation.username)
		switch (action) {
			case SessionAction.Logout:
				await this.logout()
				await this.login(reservation.username, reservation.password)
				break
			case SessionAction.Login:
				await this.login(reservation.username, reservation.password)
				break
			case SessionAction.NoAction:
			default:
				break
		}
	}

	private getLastVisibleDay(): Dayjs {
		const lastDayOfMonth = dayjs().add(1, 'month').set('date', 0)
		let daysToAdd = 0
		switch (lastDayOfMonth.day()) {
			case 0:
				daysToAdd = 0
				break
			default:
				daysToAdd = 7 - lastDayOfMonth.day()
				break
		}
		return lastDayOfMonth.add(daysToAdd, 'day')
	}

	private async navigateToDay(date: Dayjs) {
		this.loggerService.debug('Navigating to day', { date })
		if (this.getLastVisibleDay().isBefore(date)) {
			await this.page
				?.waitForSelector('td.month.next')
				.then((d) => d?.click())
				.catch((e: Error) => {
					this.loggerService.error('Failed to switch months', { error: e })
					throw new RunnerNavigationMonthError(e)
				})
		}
		await this.page
			?.waitForSelector(
				`td#cal_${date.get('year')}_${date.get('month') + 1}_${date.get(
					'date',
				)}`,
			)
			.then((d) => d?.click())
			.catch((e: Error) => {
				this.loggerService.error('Failed to select day', { error: e })
				throw new RunnerNavigationDayError(e)
			})
		await this.page
			?.waitForSelector(
				`td#cal_${date.get('year')}_${date.get('month') + 1}_${date.get(
					'date',
				)}.selected`,
			)
			.catch((e: Error) => {
				this.loggerService.error('Failed to wait for selected day', {
					error: e,
				})
				throw new RunnerNavigationSelectionError(e)
			})
	}

	private async navigateToWaitingList() {
		this.loggerService.debug('Navigating to waiting list')
		await this.page
			.goto(`${BAAN_RESERVEREN_ROOT_URL}/${BaanReserverenUrls.WaitingList}`)
			.catch((e) => {
				throw new RunnerWaitingListNavigationError(e)
			})
	}

	private async navigateToReservations() {
		this.loggerService.debug('Navigating to waiting list')
		await this.page
			.goto(`${BAAN_RESERVEREN_ROOT_URL}/${BaanReserverenUrls.Reservations}`)
			.catch((e) => {
				throw new RunnerWaitingListNavigationError(e)
			})
	}

	private async openWaitingListDialog() {
		this.loggerService.debug('Opening waiting list dialog')
		await this.page.waitForNetworkIdle()
		await this.page.goto(
			`${BAAN_RESERVEREN_ROOT_URL}/${BaanReserverenUrls.WaitingListAdd}`,
		)
	}

	private async selectAvailableTime(reservation: Reservation) {
		this.loggerService.debug('Selecting available time', {
			reservation: instanceToPlain(reservation),
		})
		let freeCourt: ElementHandle | null | undefined
		let i = 0
		const possibleDates = reservation.createPossibleDates()
		this.loggerService.debug('Possible dates', { possibleDates })
		while (i < possibleDates.length && !freeCourt) {
			const possibleDate = possibleDates[i]
			const timeString = possibleDate.format('HH:mm')
			const selector =
				`tr[data-time='${timeString}']` + `> td.free[rowspan='3'][type='free']`
			freeCourt = await this.page?.$(selector)
			i++
		}

		if (!freeCourt) {
			throw new NoCourtAvailableError('No court available for reservation')
		}

		this.loggerService.debug('Free court found')

		await freeCourt.click().catch((e: Error) => {
			throw new RunnerCourtSelectionError(e)
		})
	}

	private async selectOpponent(id: string, name: string) {
		this.loggerService.debug('Selecting opponent', { id, name })
		const player2Search = await this.page
			?.waitForSelector('input:has(~ select[name="players[2]"])')
			.catch((e: Error) => {
				throw new RunnerOpponentSearchError(e)
			})
		await player2Search
			?.type(name, { delay: this.getTypingDelay() })
			.catch((e: Error) => {
				throw new RunnerOpponentSearchInputError(e)
			})
		await this.page?.waitForNetworkIdle().catch((e: Error) => {
			throw new RunnerOpponentSearchNetworkError(e)
		})
		await this.page
			?.$('select.br-user-select[name="players[2]"]')
			.then((d) => d?.select(id))
			.catch((e: Error) => {
				throw new RunnerOpponentSearchSelectionError(e)
			})
	}

	private async confirmReservation() {
		this.loggerService.debug('Confirming reservation')
		await this.page
			?.$('input#__make_submit')
			.then((b) => b?.click())
			.catch((e: Error) => {
				throw new RunnerReservationConfirmButtonError(e)
			})
		await this.page
			?.waitForSelector('input#__make_submit2')
			.then((b) => b?.click())
			.catch((e: Error) => {
				throw new RunnerReservationConfirmSubmitError(e)
			})
	}

	private async inputWaitingListDetails(reservation: Reservation) {
		this.loggerService.debug('Inputting waiting list details')
		const startDateInput = await this.page?.$('input[name="start_date"]')
		// Click 3 times to select all existing text
		await startDateInput?.click({ count: 3, delay: 10 }).catch((e) => {
			throw new RunnerWaitingListInputError(e)
		})
		await startDateInput
			?.type(reservation.dateRangeStart.format('DD-MM-YYYY'), {
				delay: this.getTypingDelay(),
			})
			.catch((e) => {
				throw new RunnerWaitingListInputError(e)
			})

		const endDateInput = await this.page?.$('input[name="end_date"]')
		await endDateInput
			?.type(reservation.dateRangeEnd.format('DD-MM-YYYY'), {
				delay: this.getTypingDelay(),
			})
			.catch((e) => {
				throw new RunnerWaitingListInputError(e)
			})

		const startTimeInput = await this.page?.$('input[name="start_time"]')
		await startTimeInput
			?.type(reservation.dateRangeStart.format('HH:mm'), {
				delay: this.getTypingDelay(),
			})
			.catch((e) => {
				throw new RunnerWaitingListInputError(e)
			})

		// Use the same time for start and end so that the waiting list only notifies for start time
		const endTimeInput = await this.page?.$('input[name="end_time"]')
		await endTimeInput
			?.type(reservation.dateRangeStart.add(1, 'minutes').format('HH:mm'), {
				delay: this.getTypingDelay(),
			})
			.catch((e) => {
				throw new RunnerWaitingListInputError(e)
			})
	}

	private async confirmWaitingListDetails() {
		this.loggerService.debug('Confirming waiting list details')
		const saveButton = await this.page?.$('input[type="submit"][value="Save"]')
		await saveButton?.click().catch((e) => {
			throw new RunnerWaitingListConfirmError(e)
		})
	}

	public async performReservation(reservation: Reservation) {
		await this.init(reservation)
		await this.navigateToDay(reservation.dateRangeStart)
		await this.selectAvailableTime(reservation)
		await this.selectOpponent(reservation.opponentId, reservation.opponentName)
		await this.confirmReservation()
	}

	public async addReservationToWaitList(reservation: Reservation) {
		await this.init(reservation)
		await this.navigateToWaitingList()
		await this.openWaitingListDialog()
		await this.inputWaitingListDetails(reservation)
		await this.confirmWaitingListDetails()
	}
}

export class RunnerError extends Error {
	constructor(error: Error, name?: string) {
		super(error.message)
		this.stack = error.stack
		this.name = name ?? 'RunnerError'
	}
}
export class PuppeteerError extends RunnerError {
	constructor(error: Error, name?: string) {
		super(error, name)
	}
}
export class PuppeteerBrowserLaunchError extends PuppeteerError {
	constructor(error: Error) {
		super(error, 'PuppeteerBrowserLaunchError')
	}
}
export class PuppeteerNewPageError extends PuppeteerError {
	constructor(error: Error) {
		super(error, 'PuppeteerNewPageError')
	}
}

export class RunnerNewSessionError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerNewSessionError')
	}
}

export class RunnerLogoutError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerLogoutError')
	}
}

export class RunnerLoginNavigationError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerLoginNavigationError')
	}
}
export class RunnerLoginUsernameInputError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerLoginUsernameInputError')
	}
}
export class RunnerLoginPasswordInputError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerLoginPasswordInputError')
	}
}
export class RunnerLoginSubmitError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerLoginSubmitError')
	}
}

export class RunnerNavigationMonthError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerNavigationMonthError')
	}
}
export class RunnerNavigationDayError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerNavigationDayError')
	}
}
export class RunnerNavigationSelectionError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerNavigationSelectionError')
	}
}

export class RunnerWaitingListNavigationError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerWaitingListNavigationError')
	}
}
export class RunnerWaitingListNavigationMenuError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerWaitingListNavigationMenuError')
	}
}
export class RunnerWaitingListNavigationAddError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerWaitingListNavigationAddError')
	}
}

export class RunnerWaitingListInputError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerWaitingListInputError')
	}
}

export class RunnerWaitingListConfirmError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerWaitingListConfirmError')
	}
}

export class RunnerCourtSelectionError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerCourtSelectionError')
	}
}

export class NoCourtAvailableError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'NoCourtAvailableError'
	}
}

export class RunnerOpponentSearchError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerOpponentSearchError')
	}
}
export class RunnerOpponentSearchInputError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerOpponentSearchInputError')
	}
}
export class RunnerOpponentSearchNetworkError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerOpponentSearchNetworkError')
	}
}
export class RunnerOpponentSearchSelectionError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerOpponentSearchSelectionError')
	}
}

export class RunnerReservationConfirmButtonError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerReservationConfirmButtonError')
	}
}
export class RunnerReservationConfirmSubmitError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerReservationConfirmSubmitError')
	}
}
