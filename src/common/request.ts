import dayjs, { Dayjs } from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
dayjs.extend(isSameOrBefore)

import { DateRange, Opponent } from './reservation'

export interface ReservationRequest {
  username: string
  password: string
  dateRanges: {
    start: Dayjs
    end: Dayjs
  }[]
  opponent: Opponent
}

export enum ValidationErrorCode {
  UNDEFINED_REQUEST_BODY = 1,
  INVALID_REQUEST_BODY = 2,
  INVALID_DATE_RANGE = 3,
  INVALID_START_OR_END_DATE = 4,
  INVALID_OPPONENT = 5,
}

export class ValidationError extends Error {
  public readonly code: ValidationErrorCode

  constructor(message: string, code: ValidationErrorCode) {
    super(message)
    this.code = code
  }
}

export const validateRequest = (
  body: string
): ReservationRequest => {
  const request = validateRequestBody(body)
  validateRequestDateRanges(request.dateRanges)
  validateRequestOpponent(request.opponent)
  return request
}

const validateRequestBody = (body?: string): ReservationRequest => {
  if (body === undefined) {
    throw new ValidationError('Invalid request', ValidationErrorCode.UNDEFINED_REQUEST_BODY)
  }

  const jsonBody = transformRequestBody(body)
  const { username, password, opponent, dateRanges } = jsonBody

  if (
    !username ||
    username.length < 1 ||
    !password ||
    password.length < 1 ||
    !dateRanges ||
    dateRanges.length < 1 ||
    (opponent && opponent.id && opponent.id.length < 1) ||
    (opponent && opponent.name && opponent.name.length < 1)
  ) {
    throw new ValidationError('Invalid request', ValidationErrorCode.INVALID_REQUEST_BODY)
  }

  return jsonBody
}

const transformRequestBody = (body: string): ReservationRequest => {
  const json = JSON.parse(body)
  const dateRanges: DateRange[] = json.dateRanges?.map(
    ({ start, end }: { start: string; end: string }): DateRange => {
      return { start: dayjs(start), end: dayjs(end) }
    }
  )
  return {
    username: json.username,
    password: json.password,
    opponent: json.opponent,
    dateRanges,
  }
}

const validateRequestDateRanges = (dateRanges: DateRange[]): void => {
  for (let i = 0; i < dateRanges.length; i++) {
    // checking that both dates are valid
    const { start, end } = dateRanges[i]
    if (!start.isValid() || !end.isValid()) {
      throw new ValidationError('Invalid request', ValidationErrorCode.INVALID_DATE_RANGE)
    }

    // checking that:
    // 1. start occurs after now
    // 2. start occurs before or same as end
    // 3. start and end fall on same YYYY/MM/DD
    if (
      !start.isAfter(dayjs()) ||
      !start.isSameOrBefore(end) ||
      start.format('YYYY MM DD') !== end.format('YYYY MM DD')
    ) {
      throw new ValidationError('Invalid request', ValidationErrorCode.INVALID_START_OR_END_DATE)
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
    throw new ValidationError('Invalid request', ValidationErrorCode.INVALID_OPPONENT)
  }
}
