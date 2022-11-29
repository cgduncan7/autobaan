import { Reservation } from './reservation'
import { Runner } from './runner'

let runner: Runner | undefined
const getRunner = () => {
  if (!runner) {
    runner = new Runner({ headless: true })
  }
  return runner
}

export const reserve = async (reservation?: Reservation) => {
  let reservationToPerform = reservation
  if (!reservationToPerform) {
    reservationToPerform = (await Reservation.fetchFirst()) || undefined
  }

  if (!reservationToPerform) {
    return
  }

  const runner = getRunner()
  await runner.run(reservationToPerform)
}
