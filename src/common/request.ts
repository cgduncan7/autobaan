import dayjs from './dayjs'
import { DateRange, Opponent, Reservation } from './reservation'

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

export const validateJSONRequest = async (
  body: Record<string, unknown>
): Promise<Reservation> => {
  const request = await validateRequestBody(body)
  validateRequestDateRange(request.dateRange)
  validateRequestOpponent(request.opponent)
  return request
}

const validateRequestBody = async (
  body?: Record<string, unknown>
): Promise<Reservation> => {
  if (body === undefined) {
    throw new ValidationError(
      'Invalid request',
      ValidationErrorCode.UNDEFINED_REQUEST_BODY
    )
  }

  const { username, password, dateRange, opponent }: Record<string, any> = body

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
    throw new ValidationError(
      'Invalid request',
      ValidationErrorCode.INVALID_REQUEST_BODY
    )
  }

  const reservation = new Reservation(
    { username, password },
    convertDateRangeStringToObject(dateRange),
    opponent
  )

  return reservation
}

const convertDateRangeStringToObject = ({
  start,
  end,
}: {
  start: string
  end: string
}): DateRange => ({ start: dayjs(start), end: dayjs(end) })

const validateRequestDateRange = (dateRange: DateRange): void => {
  // checking that both dates are valid
  const { start, end } = dateRange
  if (!start.isValid() || !end.isValid()) {
    throw new ValidationError(
      'Invalid request',
      ValidationErrorCode.INVALID_DATE_RANGE
    )
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
    throw new ValidationError(
      'Invalid request',
      ValidationErrorCode.INVALID_START_OR_END_DATE
    )
  }
}

const validateRequestOpponent = (opponent?: Opponent): void => {
  if (!opponent) return

  const idRegex = /^-1$|^[^-]\d+$/
  const nameRegex = /^[A-Za-z0-9 -.'()]+$/
  const { id, name } = opponent
  if (!idRegex.test(id) || !nameRegex.test(name)) {
    throw new ValidationError(
      'Invalid request',
      ValidationErrorCode.INVALID_OPPONENT
    )
  }
}
