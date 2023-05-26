import { Inject, Injectable } from '@nestjs/common'
import { Dayjs } from 'dayjs'
import { ElementHandle, Page } from 'puppeteer'
import { RunnerService } from '../service'
import { EmptyPage } from '../pages/empty'
import dayjs from '../../common/dayjs'
import { Reservation } from '../../reservations/entity'

const baanReserverenRoot = 'https://squashcity.baanreserveren.nl'

export enum BaanReserverenUrls {
  Reservations = '/reservations',
  Logout = '/auth/logout',
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

@Injectable()
export class BaanReserverenService {
  private session: BaanReserverenSession | null = null

  constructor(
    @Inject(RunnerService)
    private readonly runnerService: RunnerService,

    @Inject(EmptyPage)
    private readonly page: Page,
  ) {}

  private checkSession(username: string) {
    if (this.page.url().endsWith(BaanReserverenUrls.Reservations)) {
      return this.session?.username !== username
        ? SessionAction.Logout
        : SessionAction.NoAction
    }
    return SessionAction.Login
  }

  private startSession(username: string) {
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
    this.session = null
  }

  private async login(username: string, password: string) {
    await this.page
      .waitForSelector('input[name=username]')
      .then((i) => i?.type(username))
      .catch((e: Error) => {
        // throw new RunnerLoginUsernameInputError(e)
      })
    await this.page
      .$('input[name=password]')
      .then((i) => i?.type(password))
      .catch((e: Error) => {
        // throw new RunnerLoginPasswordInputError(e)
      })
    await this.page
      .$('button')
      .then((b) => b?.click())
      .catch((e: Error) => {
        // throw new RunnerLoginSubmitError(e)
      })
    this.startSession(username)
  }
  
  private async logout() {
    await this.page.goto(`${baanReserverenRoot}${BaanReserverenUrls.Logout}`)
    this.endSession()
  }

  private async init(reservation: Reservation) {
    await this.page.goto(baanReserverenRoot)
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

  private async navigateToDay(date: Dayjs): Promise<void> {
    if (this.getLastVisibleDay().isBefore(date)) {
      await this.page
        ?.waitForSelector('td.month.next')
        .then((d) => d?.click())
        .catch((e: Error) => {
          throw new RunnerNavigationMonthError(e)
        })
    }

    await this.page
      ?.waitForSelector(
        `td#cal_${date.get('year')}_${date.get('month') + 1}_${date.get(
          'date'
        )}`
      )
      .then((d) => d?.click())
      .catch((e: Error) => {
        throw new RunnerNavigationDayError(e)
      })
    await this.page
      ?.waitForSelector(
        `td#cal_${date.get('year')}_${date.get('month') + 1}_${date.get(
          'date'
        )}.selected`
      )
      .catch((e: Error) => {
        throw new RunnerNavigationSelectionError(e)
      })
  }

  private async selectAvailableTime(reservation: Reservation): Promise<void> {
    let freeCourt: ElementHandle | null | undefined
    let i = 0
    const possibleDates = reservation.createPossibleDates()
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

    await freeCourt.click().catch((e: Error) => {
      throw new RunnerCourtSelectionError(e)
    })
  }

  private async selectOpponent(id: string, name: string): Promise<void> {
    const player2Search = await this.page
      ?.waitForSelector('tr.res-make-player-2 > td > input')
      .catch((e: Error) => {
        throw new RunnerOpponentSearchError(e)
      })
    await player2Search?.type(name).catch((e: Error) => {
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

  private async confirmReservation(): Promise<void> {
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

  public async performReservation(reservation: Reservation) {
    await this.init(reservation)
    await this.navigateToDay(reservation.dateRangeStart)
    await this.selectAvailableTime(reservation)
    await this.selectOpponent(reservation.opponentId, reservation.opponentName)
    // await this.confirmReservation()
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
