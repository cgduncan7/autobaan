import dayjs from 'dayjs'
import { v4 } from 'uuid'
import { Logger, LogLevel } from './common/logger'
import { ReservationRequest } from './common/request'
import { Reservation } from './common/reservation'
import { Runner } from './common/runner'

const run = async (request: ReservationRequest) => {
  Logger.instantiate('local', v4(), LogLevel.DEBUG)
  const { username, password, dateRange, opponent } = request
  const reservation = new Reservation({ username, password }, dateRange, opponent)

  const runner = new Runner(username, password, [reservation])
  await runner.run({ headless: false })
}

// get supplied args
const args = process.argv.filter((_, index) => index >= 2)
if (args.length !== 9) {
  console.error(
    'Usage: npm run local <username> <password> <year> <month> <day> <startTime> <endTime> <opponentName> <opponentId>'
  )
  process.exit(1)
}

const [
  username,
  password,
  year,
  month,
  day,
  startTime,
  endTime,
  opponentName,
  opponentId,
] = args
const [startHour, startMinute] = startTime
  .split(':')
  .map((t) => Number.parseInt(t))
const [endHour, endMinute] = endTime.split(':').map((t) => Number.parseInt(t))

run({
  username: username,
  password: password,
  dateRange: {
    start: dayjs(`${year}-${month}-${day}T${startHour}:${startMinute}`),
    end: dayjs(`${year}-${month}-${day}T${endHour}:${endMinute}`),
  },
  opponent: {
    name: opponentName,
    id: opponentId,
  },
})
  .then(() => {
    console.log('Success')
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
