import { Inject, Injectable } from '@nestjs/common'
import { instanceToPlain } from 'class-transformer'
import { Dayjs } from 'dayjs'
import { ElementHandle, Page } from 'puppeteer'
import { LoggerService } from 'src/logger/service'

import dayjs from '../../common/dayjs'
import { Reservation } from '../../reservations/entity'
import { EmptyPage } from '../pages/empty'

const baanReserverenRoot = 'https://squashcity.baanreserveren.nl'

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

	private checkSession(username: string) {
		this.loggerService.debug('Checking session', {
			username,
			session: this.session,
		})
		if (this.page.url().endsWith(BaanReserverenUrls.Reservations)) {
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
		await this.page.goto(`${baanReserverenRoot}${BaanReserverenUrls.Logout}`)
		this.endSession()
	}

	private async init(reservation: Reservation) {
		this.loggerService.debug('Initializing', {
			reservation: instanceToPlain(reservation),
		})
		await this.page.goto(baanReserverenRoot)
		const action = this.checkSession(reservation.username)
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
		await this.page.goto(
			`${baanReserverenRoot}${BaanReserverenUrls.WaitingList}`,
		)
	}

	private async openWaitingListDialog() {
		const dialogLink = await this.page.$('a[href="/waitinglist/add"]')
		await dialogLink?.click()
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
			throw new NoCourtAvailableError()
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
		const startDateInput = await this.page?.$('input[name="start_date"]')
		await startDateInput?.click({ count: 3, delay: 10 }) // Click 3 times to select all existing text
		await startDateInput?.type(
			reservation.dateRangeStart.format('DD-MM-YYYY'),
			{ delay: this.getTypingDelay() },
		)

		const endDateInput = await this.page?.$('input[name="end_date"]')
		await endDateInput?.type(reservation.dateRangeEnd.format('DD-MM-YYYY'), {
			delay: this.getTypingDelay(),
		})

		const startTimeInput = await this.page?.$('input[name="start_time"]')
		startTimeInput?.type(reservation.dateRangeStart.format('HH:mm'), {
			delay: this.getTypingDelay(),
		})

		// Use the same time for start and end so that the waiting list only notifies for start time
		const endTimeInput = await this.page?.$('input[name="end_time"]')
		endTimeInput?.type(reservation.dateRangeStart.format('HH:mm'), {
			delay: this.getTypingDelay(),
		})
	}

	private async confirmWaitingListDetails() {
		const saveButton = await this.page?.$('input[type="submit"][value="Save"]')
		await saveButton?.click()
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
	constructor(error: Error) {
		super(error.message)
		this.stack = error.stack
	}
}
export class PuppeteerError extends RunnerError {}
export class PuppeteerBrowserLaunchError extends PuppeteerError {}
export class PuppeteerNewPageError extends PuppeteerError {}

export class RunnerNewSessionError extends RunnerError {}

export class RunnerLogoutError extends RunnerError {}

export class RunnerLoginNavigationError extends RunnerError {}
export class RunnerLoginUsernameInputError extends RunnerError {}
export class RunnerLoginPasswordInputError extends RunnerError {}
export class RunnerLoginSubmitError extends RunnerError {}

export class RunnerNavigationMonthError extends RunnerError {}
export class RunnerNavigationDayError extends RunnerError {}
export class RunnerNavigationSelectionError extends RunnerError {}

export class RunnerCourtSelectionError extends RunnerError {}
export class NoCourtAvailableError extends Error {}

export class RunnerOpponentSearchError extends RunnerError {}
export class RunnerOpponentSearchInputError extends RunnerError {}
export class RunnerOpponentSearchNetworkError extends RunnerError {}
export class RunnerOpponentSearchSelectionError extends RunnerError {}

export class RunnerReservationConfirmButtonError extends RunnerError {}
export class RunnerReservationConfirmSubmitError extends RunnerError {}
