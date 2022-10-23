import dayjs, { Dayjs } from 'dayjs'
import puppeteer, {
  Browser,
  BrowserConnectOptions,
  BrowserLaunchArgumentOptions,
  ElementHandle,
  LaunchOptions,
  Page,
} from 'puppeteer'
import { Logger } from './logger'
import { Opponent, Reservation } from './reservation'

export class Runner {
  private readonly username: string
  private readonly password: string
  private readonly reservations: Reservation[]

  private browser: Browser | undefined
  private page: Page | undefined

  public constructor(
    username: string,
    password: string,
    reservations: Reservation[]
  ) {
    this.username = username
    this.password = password
    this.reservations = reservations
  }

  public async run(
    options?: LaunchOptions &
      BrowserLaunchArgumentOptions &
      BrowserConnectOptions
  ): Promise<Reservation[]> {
    Logger.debug('Launching browser')
    this.browser = await puppeteer.launch(options)
    this.page = await this.browser?.newPage()
    await this.login()
    return await this.makeReservations()
  }

  private async login() {
    Logger.debug('Logging in')
    await this.page?.goto('https://squashcity.baanreserveren.nl/')
    await this.page
      ?.waitForSelector('input[name=username]')
      .then((i) => i?.type(this.username))
    await this.page
      ?.$('input[name=password]')
      .then((i) => i?.type(this.password))
    await this.page?.$('button').then((b) => b?.click())
  }

  private async makeReservations(): Promise<Reservation[]> {
    for (let i = 0; i < this.reservations.length; i++) {
      Logger.debug('Making reservation', this.reservations[i].format())
      await this.makeReservation(this.reservations[i])
    }

    return this.reservations
  }

  private async makeReservation(reservation: Reservation): Promise<void> {
    try {
      await this.navigateToDay(reservation.dateRange.start)
      await this.selectAvailableTime(reservation)
      await this.selectOpponent(reservation.opponent)
      await this.confirmReservation()
      reservation.booked = true
    } catch (err) {
      Logger.error('Error making reservation', reservation.format())
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
    Logger.debug(`Navigating to ${date.format()}`)

    if (this.getLastVisibleDay().isBefore(date)) {
      Logger.debug('Date is on different page, increase month')
      await this.page?.waitForSelector('td.month.next').then((d) => d?.click())
    }

    await this.page
      ?.waitForSelector(
        `td#cal_${date.get('year')}_${date.get('month') + 1}_${date.get(
          'date'
        )}`
      )
      .then((d) => d?.click())
    await this.page?.waitForSelector(
      `td#cal_${date.get('year')}_${date.get('month') + 1}_${date.get(
        'date'
      )}.selected`
    )
  }

  private async selectAvailableTime(res: Reservation): Promise<void> {
    Logger.debug('Selecting available time', res.format())
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
      throw new Error('No free court available')
    }

    await freeCourt.click()
  }

  private async selectOpponent(opponent: Opponent): Promise<void> {
    Logger.debug('Selecting opponent', opponent)
    const player2Search = await this.page?.waitForSelector(
      'tr.res-make-player-2 > td > input'
    )
    await player2Search?.type(opponent.name)
    await this.page?.waitForNetworkIdle()
    await this.page
      ?.$('select.br-user-select[name="players[2]"]')
      .then((d) => d?.select(opponent.id))
  }

  private async confirmReservation(): Promise<void> {
    await this.page?.$('input#__make_submit').then((b) => b?.click())
    await this.page
      ?.waitForSelector('input#__make_submit2')
      .then((b) => b?.click())
  }
}
