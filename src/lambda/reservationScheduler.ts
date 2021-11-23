import { SQSEvent, SQSHandler } from 'aws-lambda'
import { validateRequestEvent } from '../common/request'

import { Reservation } from '../common/reservation'
import { Runner } from '../common/runner'

export const run: SQSHandler = async (event: SQSEvent): Promise<void> => {
  const { request, error } = validateRequestEvent(event)
  if (error || !request) {
    throw new Error(error?.message)
  }

  const { username, password, dateTimes, opponent } = request
  const reservations = dateTimes.map((dt) => new Reservation(dt, opponent))

  const runner = new Runner(username, password, reservations)
  await runner.run({ headless: false })
}
