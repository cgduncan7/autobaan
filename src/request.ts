import { SQSEvent } from 'aws-lambda'
import { DateTime, Opponent } from './reservation'

export interface IncomingRequest {
  username: string
  password: string
  dateTimes: DateTime[]
  opponent: Opponent
}

export interface ValidationError {
  message: string
  code: number
}

export const validateRequestEvent = (
  event: SQSEvent
): { request?: IncomingRequest; error?: ValidationError } => {
  try {
    const request = validateRequestBody(event.Records[0].body)
    validateRequestDateTimes(request.dateTimes)
    validateRequestOpponent(request.opponent)
    return { request }
  } catch (err: unknown) {
    return { error: { message: 'Invalid request', code: (err as ValidationError).code ?? 0 } }
  }
}

const validateRequestBody = (body?: string): IncomingRequest => {
  if (body === undefined) {
    throw {
      message: 'Invalid request',
      code: 1,
    }
  }

  let jsonBody: IncomingRequest
  try {
    jsonBody = JSON.parse(body)
  } catch (err) {
    throw {
      message: 'Invalid request',
      code: 2,
    }
  }

  const { username, password, dateTimes } = jsonBody
  if (
    !username ||
    username.length < 1 ||
    !password ||
    password.length < 1 ||
    !dateTimes
  ) {
    throw {
      message: 'Invalid request',
      code: 3,
    }
  }

  return jsonBody
}

const validateRequestDateTimes = (dateTimes: DateTime[]): void => {
  const now = new Date()
  for (let i = 0; i < dateTimes.length; i++) {
    const dateTime = dateTimes[i]
    const { year, month, day, timeRange } = dateTime
    const { start, end } = timeRange

    if (
      typeof year !== 'number' ||
      typeof month !== 'number' ||
      typeof day !== 'number' ||
      typeof start.hour !== 'number' ||
      typeof start.minute !== 'number' ||
      typeof end.hour !== 'number' ||
      typeof end.minute !== 'number'
    ) {
      throw {
        message: 'Invalid request',
        code: 4,
      }
    }

    const date = new Date()
    date.setFullYear(year, month - 1, day)
    date.setHours(start.hour, start.minute)

    if (now.getTime() >= date.getTime()) {
      throw {
        message: 'Invalid request',
        code: 5,
      }
    }
  }
}

const validateRequestOpponent = (opponent?: Opponent): void => {
  if (!opponent) return

  const { id, name } = opponent
  if (
    typeof id !== 'string' ||
    typeof name !== 'string' ||
    id.length < 1 ||
    name.length < 1
  ) {
    throw {
      message: 'Invalid request',
      code: 6,
    }
  }
}
