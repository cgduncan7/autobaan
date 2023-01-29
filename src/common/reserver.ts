import { asyncLocalStorage as l } from './logger'
import { Reservation } from './reservation'
import { LoggableError, Runner } from './runner'

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

export const reserve = async (reservation?: Reservation): Promise<boolean> => {
  let reservationToPerform = reservation
  if (!reservationToPerform) {
    l.getStore()?.debug('No reservation provided, fetching first in database')
    reservationToPerform = (await Reservation.fetchFirst()) || undefined
  }

  if (!reservationToPerform) {
    l.getStore()?.info('No reservation to perform')
    return true
  }
  
  l.getStore()?.debug('Trying to perform reservation', { reservationToPerform })
  const runner = getRunner()
  try {
    await runner.run(reservationToPerform)
    await Reservation.delete(reservationToPerform)
    return true
  } catch (error) {
    l.getStore()?.error('Failed to perform reservation', { error: (error as LoggableError).toString() })
    return false
  }
}
