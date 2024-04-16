import { InjectQueue } from '@nestjs/bull'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { instanceToPlain } from 'class-transformer'
import { Dayjs } from 'dayjs'
import { ElementHandle, Page } from 'puppeteer'

import dayjs from '../../common/dayjs'
import { LoggerService } from '../../logger/service.logger'
import { MONITORING_QUEUE_NAME, MonitoringQueue } from '../../monitoring/config'
import { MonitorType } from '../../monitoring/entity'
import { Opponent, Reservation } from '../../reservations/entity'
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

// TODO: Add to DB to make configurable
enum CourtSlot {
	One = '51',
	Two = '52',
	Three = '53',
	Four = '54',
	Five = '55',
	Six = '56',
	Seven = '57',
	Eight = '58',
	Nine = '59',
	Ten = '60',
	Eleven = '61',
	Twelve = '62',
	Thirteen = '63',
}

const CourtSlotToNumber = {
	[CourtSlot.One]: 1,
	[CourtSlot.Two]: 2,
	[CourtSlot.Three]: 3,
	[CourtSlot.Four]: 4,
	[CourtSlot.Five]: 5,
	[CourtSlot.Six]: 6,
	[CourtSlot.Seven]: 7,
	[CourtSlot.Eight]: 8,
	[CourtSlot.Nine]: 9,
	[CourtSlot.Ten]: 10,
	[CourtSlot.Eleven]: 11,
	[CourtSlot.Twelve]: 12,
	[CourtSlot.Thirteen]: 13,
} as const

// Lower is better
const CourtRank = {
	[CourtSlot.One]: 0,
	[CourtSlot.Two]: 0,
	[CourtSlot.Three]: 0,
	[CourtSlot.Four]: 0,
	[CourtSlot.Five]: 99, // shitty
	[CourtSlot.Six]: 99, // shitty
	[CourtSlot.Seven]: 0,
	[CourtSlot.Eight]: 0,
	[CourtSlot.Nine]: 0,
	[CourtSlot.Ten]: 0,
	[CourtSlot.Eleven]: 1, // no one likes upstairs
	[CourtSlot.Twelve]: 1, // no one likes upstairs
	[CourtSlot.Thirteen]: 1, // no one likes upstairs
} as const

const TYPING_DELAY_MS = 2

@Injectable()
export class BaanReserverenService {
	private session: BaanReserverenSession | null = null
	private username: string
	private password: string

	constructor(
		@InjectQueue(MONITORING_QUEUE_NAME)
		private readonly monitoringQueue: MonitoringQueue,

		@Inject(LoggerService)
		private readonly loggerService: LoggerService,

		@Inject(ConfigService)
		private readonly configService: ConfigService,

		@Inject(EmptyPage)
		private readonly page: Page,
	) {
		this.username = this.configService.getOrThrow<string>(
			'BAANRESERVEREN_USERNAME',
		)
		this.password = this.configService.getOrThrow<string>(
			'BAANRESERVEREN_PASSWORD',
		)
	}

	// tryna be sneaky
	private getTypingDelay() {
		return TYPING_DELAY_MS
	}

	private async handleError() {
		await this.page
			.screenshot({
				type: 'jpeg',
				path: `./${Date.now()}_error-screenshot.jpeg`,
				quality: 50,
			})
			.catch((reason: any) =>
				this.loggerService.warn('Failed to take screenshot', { reason }),
			)
	}

	// Check session by going to /reservations to see if we are still logged in via cookies
	private async checkSession(username: string) {
		this.loggerService.debug('Checking session', {
			username,
			session: this.session,
		})

		if (!this.page.url().includes(BAAN_RESERVEREN_ROOT_URL)) {
			await this.navigateToReservations()
		}

		if (this.page.url().includes('?reason=LOGGED_IN')) {
			return SessionAction.Login
		}

		return this.session?.username !== this.username
			? SessionAction.Logout
			: SessionAction.NoAction
	}

	private startSession(username: string) {
		this.loggerService.debug('Starting session', { username })
		if (this.session && this.session.username !== username) {
			throw new SessionStartError('Session already started')
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
		await this.page.waitForNetworkIdle()
		this.startSession(username)
	}

	private async logout() {
		this.loggerService.debug('Logging out')
		await this.page.goto(
			`${BAAN_RESERVEREN_ROOT_URL}/${BaanReserverenUrls.Logout}`,
		)
		await this.page.waitForNetworkIdle()
		this.endSession()
	}

	private async init() {
		this.loggerService.debug('Initializing')
		await this.navigateToReservations()
		const action = await this.checkSession(this.username)
		switch (action) {
			case SessionAction.Logout:
				await this.logout()
				await this.login(this.username, this.password)
				break
			case SessionAction.Login:
				await this.login(this.username, this.password)
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
				.waitForSelector('td.month.next')
				.then((d) => d?.click())
				.catch((e: Error) => {
					this.loggerService.error('Failed to switch months', {
						error: e.message,
					})
					throw new RunnerNavigationMonthError(e)
				})
		}
		await this.page
			.waitForSelector(
				`td#cal_${date.get('year')}_${date.get('month') + 1}_${date.get(
					'date',
				)}`,
			)
			.then((d) => d?.click())
			.catch((e: Error) => {
				this.loggerService.error('Failed to select day', {
					error: e.message,
				})
				throw new RunnerNavigationDayError(e)
			})
		await this.page
			.waitForSelector(
				`td#cal_${date.get('year')}_${date.get('month') + 1}_${date.get(
					'date',
				)}.selected`,
			)
			.catch((e: Error) => {
				this.loggerService.error('Failed to wait for selected day', {
					error: e.message,
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
		await this.page.waitForNetworkIdle()
	}

	private async navigateToReservations() {
		this.loggerService.debug('Navigating to reservations')
		await this.page
			.goto(`${BAAN_RESERVEREN_ROOT_URL}/${BaanReserverenUrls.Reservations}`)
			.catch((e) => {
				throw new RunnerWaitingListNavigationError(e)
			})
		await this.page.waitForNetworkIdle()
	}

	private async recordWaitingListEntries(): Promise<number[]> {
		const waitingListEntriesElements = await this.page.$$(
			'#content tbody tr td:nth-child(1)',
		)
		if (!waitingListEntriesElements) return []

		const waitingListIds = (
			await Promise.all(
				waitingListEntriesElements.map(async (e) => {
					const elementTextContent = await (
						await e.getProperty('textContent')
					).jsonValue()

					if (elementTextContent) {
						return Number.parseInt(elementTextContent)
					}
				}),
			)
		).filter((id): id is number => id != null && typeof id === 'number')

		return waitingListIds
	}

	private findNewWaitingListEntryId(
		previous: number[],
		current: number[],
	): number | null {
		const previousSet = new Set(previous)
		for (const c of current) {
			if (!previousSet.has(c)) return c
		}

		return null
	}

	private async deleteWaitingListEntryRowById(id: number) {
		const rows = await this.page.$x(`//td[text()="${id}"]/parent::tr`)
		if (rows.length === 0) {
			this.loggerService.error('Cannot find waiting list entry to delete')
			return
		}

		const acceptedDialogPromise = new Promise<void>((res, rej) => {
			this.page.once('dialog', async (dialog) => {
				await dialog.accept().catch(rej)
				res()
			})
			setTimeout(rej, 10000)
		})

		const deleteButton = await rows[0].$('a.wl-delete')
		await deleteButton?.click()
		await acceptedDialogPromise
	}

	private async openWaitingListDialog() {
		this.loggerService.debug('Opening waiting list dialog')
		await this.page.goto(
			`${BAAN_RESERVEREN_ROOT_URL}/${BaanReserverenUrls.WaitingListAdd}`,
		)
		await this.page.waitForNetworkIdle()
	}

	// As a wise man once said, «Из говна и палок»
	private async sortCourtsByRank(
		freeCourts: ElementHandle<Element>[],
	): Promise<ElementHandle | null> {
		if (freeCourts.length === 0) return null
		const freeCourtsWithJson = await Promise.all(
			freeCourts.map(async (fc) => ({
				elementHAndle: fc,
				jsonValue: await fc.jsonValue(),
			})),
		)
		freeCourtsWithJson.sort(
			(a, b) =>
				(CourtRank[a.jsonValue.slot as CourtSlot] ?? 99) -
				(CourtRank[b.jsonValue.slot as CourtSlot] ?? 99),
		)
		return freeCourtsWithJson[0].elementHAndle
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
			const freeCourts = await this.page.$$(selector)
			freeCourt = await this.sortCourtsByRank(freeCourts)
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

	private async selectOwner(id: string) {
		this.loggerService.debug('Selecting owner', { id })
		await this.page.waitForNetworkIdle().catch((e: Error) => {
			throw new RunnerOwnerSearchNetworkError(e)
		})
		await this.page
			.$('select.br-user-select[name="players[1]"]')
			.then((d) => d?.select(id))
			.catch((e: Error) => {
				throw new RunnerOwnerSearchSelectionError(e)
			})
	}

	private async selectOpponents(opponents: Opponent[]) {
		try {
			for (let idx = 0; idx < opponents.length; idx += 1) {
				const { id, name } = opponents[idx]
				await this.selectOpponent(id, name, idx)
			}
		} catch (error: unknown) {
			if (error instanceof RunnerOwnerSearchSelectionError) {
				this.loggerService.warn(
					'Improper opponents selected, falling back to guest opponent',
				)
				return await this.selectOpponent('-1', 'Gast', 0)
			}
			throw error
		}
	}

	private async selectOpponent(id: string, name: string, index: number) {
		if (index < 0 || index > 4) {
			throw new RunnerOwnerSearchSelectionError(
				new Error('Invalid opponent index'),
			)
		}
		const resolvedIndex = index + 2 // players[1] is the owner; players[2,3,4] are the opponents
		this.loggerService.debug('Selecting opponent', { id, name })
		const playerSearch = await this.page
			.waitForSelector(`input:has(~ select[name="players[${resolvedIndex}]"])`)
			.catch((e: Error) => {
				throw new RunnerOpponentSearchError(e)
			})
		await playerSearch
			?.type(name, { delay: this.getTypingDelay() })
			.catch((e: Error) => {
				throw new RunnerOpponentSearchInputError(e)
			})
		await this.page.waitForNetworkIdle().catch((e: Error) => {
			throw new RunnerOpponentSearchNetworkError(e)
		})
		await this.page
			.$(`select.br-user-select[name="players[${resolvedIndex}]"]`)
			.then((d) => d?.select(id))
			.catch((e: Error) => {
				throw new RunnerOpponentSearchSelectionError(e)
			})
	}

	private async confirmReservation() {
		this.loggerService.debug('Confirming reservation')
		await this.page
			.$('input#__make_submit')
			.then((b) => b?.click())
			.catch((e: Error) => {
				throw new RunnerReservationConfirmButtonError(e)
			})
		await this.page
			.waitForSelector('input#__make_submit2')
			.then((b) => b?.click())
			.catch((e: Error) => {
				throw new RunnerReservationConfirmSubmitError(e)
			})
		await this.page.waitForNetworkIdle()
	}

	private async inputWaitingListDetails(reservation: Reservation) {
		this.loggerService.debug('Inputting waiting list details')
		const startDateInput = await this.page.$('input[name="start_date"]')
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

		const endDateInput = await this.page.$('input[name="end_date"]')
		await endDateInput
			?.type(reservation.dateRangeEnd.format('DD-MM-YYYY'), {
				delay: this.getTypingDelay(),
			})
			.catch((e) => {
				throw new RunnerWaitingListInputError(e)
			})

		const startTimeInput = await this.page.$('input[name="start_time"]')
		await startTimeInput
			?.type(reservation.dateRangeStart.format('HH:mm'), {
				delay: this.getTypingDelay(),
			})
			.catch((e) => {
				throw new RunnerWaitingListInputError(e)
			})

		// Use one reservation (45m) as end time because it seems to work better
		const endTimeInput = await this.page.$('input[name="end_time"]')
		await endTimeInput
			?.type(reservation.dateRangeStart.add(45, 'minutes').format('HH:mm'), {
				delay: this.getTypingDelay(),
			})
			.catch((e) => {
				throw new RunnerWaitingListInputError(e)
			})
	}

	private async confirmWaitingListDetails() {
		this.loggerService.debug('Confirming waiting list details')
		const saveButton = await this.page.$('input[type="submit"]')
		await saveButton?.click().catch((e) => {
			throw new RunnerWaitingListConfirmError(e)
		})
		await this.page.waitForNetworkIdle()
	}

	private async getAllCourtStatuses() {
		const courts = await this.page.$$('tr > td.slot')
		const courtStatuses: {
			courtNumber: string
			startTime: string
			status: string
			duration: string
		}[] = []
		for (const court of courts) {
			const classListObj = await (
				await court.getProperty('classList')
			).jsonValue()
			const classList = Object.values(classListObj)
			const rClass = classList.filter((cl) => /r-\d{2}/.test(cl))[0]
			const courtNumber =
				`${CourtSlotToNumber[rClass.replace(/r-/, '') as CourtSlot]}` ??
				'unknown court'
			const startTime = await court
				.$eval('div.slot-period', (e) => e.innerText.trim())
				.catch(() => 'unknown')
			const status = classList.includes('free') ? 'available' : 'unavailable'
			const courtRowSpan = await (
				await court.getProperty('rowSpan')
			).jsonValue()
			const duration = `${Number(courtRowSpan ?? '0') * 15} minutes`
			courtStatuses.push({ courtNumber, startTime, status, duration }) //const d = require('dayjs'); await get(BaanReserverenService).monitorCourtReservations(d());
		}

		return courtStatuses
	}

	public async performReservation(
		reservation: Reservation,
		timeSensitive = true,
	) {
		try {
			await this.init()
			await this.navigateToDay(reservation.dateRangeStart)
			await this.monitorCourtReservations()
			await this.selectAvailableTime(reservation)
			await this.selectOwner(reservation.ownerId)
			await this.selectOpponents(reservation.opponents)
			await this.confirmReservation()
		} catch (error: unknown) {
			if (!timeSensitive) await this.handleError()
			throw error
		}
	}

	public async addReservationToWaitList(
		reservation: Reservation,
		timeSensitive = true,
	) {
		try {
			await this.init()
			await this.navigateToWaitingList()
			const previousWaitingListIds = await this.recordWaitingListEntries()
			await this.openWaitingListDialog()
			await this.inputWaitingListDetails(reservation)
			await this.confirmWaitingListDetails()
			await this.navigateToWaitingList()
			const currentWaitingListIds = await this.recordWaitingListEntries()
			const waitingListId = this.findNewWaitingListEntryId(
				previousWaitingListIds,
				currentWaitingListIds,
			)

			if (waitingListId == null) {
				throw new WaitingListSubmissionError(
					'Failed to find new waiting list entry',
				)
			}

			return waitingListId
		} catch (error: unknown) {
			if (!timeSensitive) await this.handleError()
			throw error
		}
	}

	public async removeReservationFromWaitList(reservation: Reservation) {
		try {
			if (!reservation.waitListed || !reservation.waitingListId) return
			await this.init()
			await this.navigateToWaitingList()
			await this.deleteWaitingListEntryRowById(reservation.waitingListId)
		} catch (error: unknown) {
			await this.handleError()
			throw error
		}
	}

	public async monitorCourtReservations(date?: Dayjs, swallowError = true) {
		try {
			if (date) {
				await this.init()
				await this.navigateToDay(date)
			}
			const statuses = await this.getAllCourtStatuses()
			await this.monitoringQueue.add(
				{
					type: MonitorType.CourtReservations,
					data: statuses,
				},
				{ delay: 60 * 1000 },
			)
		} catch (error: unknown) {
			this.loggerService.error(
				`Failed to monitor court reservations: ${(error as Error).message}`,
			)
			if (!swallowError) {
				throw error
			}
		}
	}

	public async warmup() {
		await this.init()
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

export class RunnerOwnerSearchNetworkError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerOwnerSearchNetworkError')
	}
}
export class RunnerOwnerSearchSelectionError extends RunnerError {
	constructor(error: Error) {
		super(error, 'RunnerOwnerSearchSelectionError')
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

export class SessionStartError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'SessionStartError'
	}
}

export class WaitingListSubmissionError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'WaitingListSubmissionError'
	}
}

export class WaitingListEntryDeletionError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'WaitingListEntryDeletionError'
	}
}
