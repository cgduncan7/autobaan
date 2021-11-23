import { Dayjs } from 'dayjs'
import puppeteer, {
  Browser,
  BrowserConnectOptions,
  BrowserLaunchArgumentOptions,
  ElementHandle,
  LaunchOptions,
  Page,
} from 'puppeteer'

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
    this.browser = await puppeteer.launch(options)
    this.page = await this.browser.newPage()
    await this.login()
    return await this.makeReservations()
  }

  private async login() {
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
      console.error(err)
    }
  }

  private async navigateToDay(date: Dayjs): Promise<void> {
    await this.page
      ?.waitForSelector(
        `td#cal_${date.get('year')}_${date.get('month') + 1}_${date.get('day')}`
      )
      .then((d) => d?.click())
    await this.page?.waitForSelector(
      `td#cal_${date.get('year')}_${date.get('month') + 1}_${date.get(
        'day'
      )}.selected`
    )
  }

  private async selectAvailableTime(res: Reservation): Promise<void> {
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
