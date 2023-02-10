import dayjs from './dayjs'
import { asyncLocalStorage as l, LoggableError } from './logger'
import { Reservation } from './reservation'
import { Runner } from './runner'

let runner: Runner | undefined
const getRunner = () => {
  if (!runner) {
    runner = new Runner({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }
  return runner
}

export const reserve = async (
  reservations?: Reservation[]
): Promise<boolean> => {
  let reservationsToPerform = reservations
  if (!reservationsToPerform) {
    l.getStore()?.debug('No reservation provided, fetching first in database')
    reservationsToPerform =
      (await Reservation.fetchByDate(dayjs())) || undefined
  }

  if (!reservationsToPerform || reservationsToPerform.length === 0) {
    l.getStore()?.info('No reservation to perform')
    return true
  }

  for (const reservationToPerform of reservationsToPerform) {
    l.getStore()?.debug('Trying to perform reservation', {
      reservationToPerform: reservationToPerform.toString(true),
    })
    const runner = getRunner()
    try {
      await runner.run(reservationToPerform)
      await reservationToPerform.delete()
    } catch (error) {
      l.getStore()?.error('Failed to perform reservation', {
        error: (error as LoggableError).toString(),
      })
      return false
    }
  }

  return true
}
