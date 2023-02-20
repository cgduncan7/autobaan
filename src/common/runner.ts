import { Dayjs } from 'dayjs'
import dayjs from './dayjs'
import puppeteer, {
  Browser,
  BrowserConnectOptions,
  BrowserLaunchArgumentOptions,
  ElementHandle,
  LaunchOptions,
  Page,
} from 'puppeteer'
import { asyncLocalStorage as l, LoggableError } from './logger'
import { Opponent, Reservation } from './reservation'

enum SessionAction {
  NoAction,
  Logout,
  Login,
}

interface RunnerSession {
  username: string
  loggedInAt: Dayjs
}

export class Runner {
  private browser?: Browser
  private page?: Page
  private options?: LaunchOptions &
    BrowserLaunchArgumentOptions &
    BrowserConnectOptions
  private session?: RunnerSession

  constructor(
    options?: LaunchOptions &
      BrowserLaunchArgumentOptions &
      BrowserConnectOptions
  ) {
    const defaultArgs = ['--disable-setuid-sandbox', '--no-sandbox']
    this.options = { args: defaultArgs, ...options }
  }

  public async test() {
    l.getStore()?.debug('Runner test')
    try {
      if (!this.browser) {
        this.browser = await puppeteer.launch(this.options)
      }
    } catch (error: unknown) {
      l.getStore()?.error('Browser error', { error: (error as Error).message })
      throw new PuppeteerBrowserLaunchError(error as Error)
    }

    try {
      this.page = await this.browser?.newPage()
    } catch (error) {
      l.getStore()?.error('Page error', { error: (error as Error).message })
      throw new PuppeteerNewPageError(error as Error)
    }
  }

  public async run(reservation: Reservation) {
    try {
      if (!this.browser) {
        l.getStore()?.debug('Launching browser')
        this.browser = await puppeteer.launch(this.options)
      }
    } catch (error) {
      throw new PuppeteerBrowserLaunchError(error as Error)
    }
    await this.startSession(reservation)
    await this.makeReservation(reservation)
  }

  private async checkSession(username: string): Promise<SessionAction> {
    if (
      this.page
        ?.url()
        .startsWith('https://squashcity.baanreserveren.nl/reservations')
    ) {
      l.getStore()?.info('Already logged in', { username })
      return this.session?.username !== username
        ? SessionAction.Logout
        : SessionAction.NoAction
    }
    return SessionAction.Login
  }

  private async startSession(reservation: Reservation) {
    if (!this.page) {
      try {
        this.page = await this.browser?.newPage()
      } catch (error) {
        throw new PuppeteerNewPageError(error as Error)
      }
    }

    this.page
      ?.goto('https://squashcity.baanreserveren.nl/reservations')
      .catch((e: Error) => {
        throw new RunnerNewSessionError(e)
      })

    const sessionAction = await this.checkSession(reservation.user.username)
    switch (sessionAction) {
      case SessionAction.Login: {
        await this.login(reservation.user.username, reservation.user.password)
        break
      }
      case SessionAction.Logout: {
        await this.logout()
        await this.login(reservation.user.username, reservation.user.password)
        break
      }
      case SessionAction.NoAction:
      default:
        break
    }
  }

  private async login(username: string, password: string) {
    l.getStore()?.debug('Logging in', { username })
    await this.page
      ?.waitForSelector('input[name=username]')
      .then((i) => i?.type(username))
      .catch((e: Error) => {
        throw new RunnerLoginUsernameInputError(e)
      })
    await this.page
      ?.$('input[name=password]')
      .then((i) => i?.type(password))
      .catch((e: Error) => {
        throw new RunnerLoginPasswordInputError(e)
      })
    await this.page
      ?.$('button')
      .then((b) => b?.click())
      .catch((e: Error) => {
        throw new RunnerLoginSubmitError(e)
      })
  }

  private async logout() {
    l.getStore()?.debug('Logging out', { username: this.session?.username })
    await this.page
      ?.goto('https://squashcity.baanreserveren.nl/auth/logout')
      .catch((e: Error) => {
        throw new RunnerLogoutError(e)
      })
  }

  private async makeReservation(reservation: Reservation) {
    await this.navigateToDay(reservation.dateRange.start)
    await this.selectAvailableTime(reservation)
    await this.selectOpponent(reservation.opponent)
    await this.confirmReservation()
    reservation.booked = true
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
    l.getStore()?.debug(`Navigating to ${date.format()}`)

    if (this.getLastVisibleDay().isBefore(date)) {
      l.getStore()?.debug('Date is on different page, increase month')
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

  private async selectAvailableTime(res: Reservation): Promise<void> {
    l.getStore()?.debug('Selecting available time', {
      reservation: res.toString(true),
    })
    let freeCourt: ElementHandle | null | undefined
    let i = 0
    while (i < res.possibleDates.length && !freeCourt) {
      const possibleDate = res.possibleDates[i]
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

  private async selectOpponent(opponent: Opponent): Promise<void> {
    l.getStore()?.debug('Selecting opponent', { opponent })
    const player2Search = await this.page
      ?.waitForSelector('tr.res-make-player-2 > td > input')
      .catch((e: Error) => {
        throw new RunnerOpponentSearchError(e)
      })
    await player2Search?.type(opponent.name).catch((e: Error) => {
      throw new RunnerOpponentSearchInputError(e)
    })
    await this.page?.waitForNetworkIdle().catch((e: Error) => {
      throw new RunnerOpponentSearchNetworkError(e)
    })
    await this.page
      ?.$('select.br-user-select[name="players[2]"]')
      .then((d) => d?.select(opponent.id))
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
}

export class RunnerError extends LoggableError {
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
export class NoCourtAvailableError extends LoggableError {}

export class RunnerOpponentSearchError extends RunnerError {}
export class RunnerOpponentSearchInputError extends RunnerError {}
export class RunnerOpponentSearchNetworkError extends RunnerError {}
export class RunnerOpponentSearchSelectionError extends RunnerError {}

export class RunnerReservationConfirmButtonError extends RunnerError {}
export class RunnerReservationConfirmSubmitError extends RunnerError {}
