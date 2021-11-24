import { Handler } from 'aws-lambda'
import dayjs from 'dayjs'

import { InputEvent } from '../stepFunctions/event'
import { Reservation } from '../common/reservation'
import { validateRequest } from '../common/request'
import { Runner } from '../common/runner'

export const run: Handler<InputEvent, void> = async (input: InputEvent): Promise<void> => {
  console.log(`Handling event: ${input}`)
  const { username, password, dateRange, opponent } = validateRequest(JSON.stringify(input.reservationRequest))
  console.log('Successfully validated request')

  console.log('Creating reservation')
  const reservation = new Reservation(dateRange, opponent)
  console.log('Created reservation')

  console.log('Runner starting')
  const runner = new Runner(username, password, [reservation])
  await runner.run()
  console.log('Runner finished')
}
