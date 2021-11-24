import dayjs, { Dayjs } from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
dayjs.extend(isSameOrBefore)

import { DateRange, Opponent } from './reservation'

export interface ReservationRequest {
  username: string
  password: string
  dateRange: {
    start: Dayjs
    end: Dayjs
  }
  opponent: Opponent
}

export enum ValidationErrorCode {
  UNDEFINED_REQUEST_BODY,
  INVALID_JSON,
  INVALID_REQUEST_BODY,
  INVALID_DATE_RANGE,
  INVALID_START_OR_END_DATE,
  INVALID_OPPONENT,
}

export class ValidationError extends Error {
  public readonly code: ValidationErrorCode

  constructor(message: string, code: ValidationErrorCode) {
    super(message)
    this.code = code
  }
}

/**
 * Validates an incoming request body and converts to ReservationRequest
 * @param body String of request body
 * @returns ReservationRequest
 */
export const validateRequest = (
  body: string
): ReservationRequest => {
  const request = validateRequestBody(body)
  validateRequestDateRange(request.dateRange)
  validateRequestOpponent(request.opponent)
  return request
}

const validateRequestBody = (body?: string): ReservationRequest => {
  if (body === undefined) {
    throw new ValidationError('Invalid request', ValidationErrorCode.UNDEFINED_REQUEST_BODY)
  }

  const jsonBody = transformRequestBody(body)
  const { username, password, opponent, dateRange } = jsonBody

  if (
    !username ||
    username.length < 1 ||
    !password ||
    password.length < 1 ||
    !dateRange ||
    !dateRange.start ||
    !dateRange.end ||
    (opponent && opponent.id && opponent.id.length < 1) ||
    (opponent && opponent.name && opponent.name.length < 1)
  ) {
    throw new ValidationError('Invalid request', ValidationErrorCode.INVALID_REQUEST_BODY)
  }

  return jsonBody
}

const transformRequestBody = (body: string): ReservationRequest => {
  let json
  try {
    json = JSON.parse(body)
  } catch (err) {
    throw new ValidationError('Invalid request', ValidationErrorCode.INVALID_JSON)
  }
  const startTime = json.dateRange?.start ?? 'invalid'
  const endTime = json.dateRange?.end ?? 'invalid'
  const dateRange: DateRange = { start: dayjs(startTime), end: dayjs(endTime) }
  return {
    username: json.username,
    password: json.password,
    opponent: json.opponent,
    dateRange,
  }
}

const validateRequestDateRange = (dateRange: DateRange): void => {
  // checking that both dates are valid
  const { start, end } = dateRange
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
