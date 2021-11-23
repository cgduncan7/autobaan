import { SQSEvent, SQSHandler } from 'aws-lambda'
import { validateRequest } from '../common/request'

import { Reservation } from '../common/reservation'
import { Runner } from '../common/runner'

export const run: SQSHandler = async (event: SQSEvent): Promise<void> => {
  const { request, error } = validateRequest(event.Records[0].body)
  if (error || !request) {
    throw new Error(error?.message)
  }

  const { username, password, dateRanges, opponent } = request
  const reservations = dateRanges.map((dr) => new Reservation(dr, opponent))

  const runner = new Runner(username, password, reservations)
  await runner.run({ headless: false })
}
