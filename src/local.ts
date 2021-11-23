import { IncomingRequest } from './common/request'
import { Reservation } from './common/reservation'
import { Runner } from './common/runner'

const run = async (request: IncomingRequest) => {
  const { username, password, dateTimes, opponent } = request
  const reservations = dateTimes.map((dt) => new Reservation(dt, opponent))

  const runner = new Runner(username, password, reservations)
  await runner.run({ headless: false })
}

// get supplied args
const args = process.argv.filter((_, index) => index >= 2)
if (args.length !== 7) {
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
  dateTimes: [
    {
      year: Number.parseInt(year),
      month: Number.parseInt(month),
      day: Number.parseInt(day),
      timeRange: {
        start: {
          hour: startHour,
          minute: startMinute,
        },
        end: {
          hour: endHour,
          minute: endMinute,
        },
      },
    },
  ],
  opponent: {
    id: opponentId,
    name: opponentName,
  },
})
  .then(() => console.log('Success'))
  .catch((e) => console.error(e))
