import { AsyncLocalStorage } from 'async_hooks'
import dayjs from './dayjs'

export enum LogLevel {
  DEBUG,
  INFO,
  ERROR,
}

export const asyncLocalStorage = new AsyncLocalStorage<Logger>()

export class Logger {
  private readonly tag: string
  private readonly correlationId: string
  private readonly level: LogLevel

  public constructor(
    tag: string,
    correlationId: string,
    level = LogLevel.ERROR
  ) {
    this.tag = tag
    this.correlationId = correlationId
    this.level = level
  }

  private log(logLevel: LogLevel, message: string, details?: unknown): void {
    if (logLevel < this.level) {
      return
    }

    let levelString
    switch (logLevel) {
      case LogLevel.ERROR:
        levelString = 'ERROR'
        break
      case LogLevel.INFO:
        levelString = 'INFO'
        break
      case LogLevel.DEBUG:
      default:
        levelString = 'DEBUG'
        break
    }

    let fmtString = '(%s) <%s> [%s] %s: %s'
    const params: Array<unknown> = [
      dayjs().format(),
      this.tag,
      this.correlationId,
      levelString,
      message,
    ]
    if (details) {
      if (typeof details === 'object') {
        const toObfuscate = ['password']
        toObfuscate.forEach((key) => {
          if ((details as Record<string, unknown>)[key]) {
            // Prettier and eslint are fighting
            // eslint-disable-next-line @typescript-eslint/no-extra-semi
            ;(details as Record<string, unknown>)[key] = '***'
          }
        })
      }
      params.push(details)
      fmtString += ' - %O'
    }

    if (logLevel === LogLevel.ERROR) {
      console.error(fmtString, ...params)
    } else {
      console.log(fmtString, ...params)
    }
  }

  public debug(message: string, details?: unknown): void {
    this.log(LogLevel.DEBUG, message, details)
  }

  public info(message: string, details?: unknown): void {
    this.log(LogLevel.INFO, message, details)
  }

  public error(message: string, details?: unknown): void {
    this.log(LogLevel.ERROR, message, details)
  }
}

export class LoggableError extends Error {
  toString() {
    return `${this.name} - ${this.message}\n${this.stack}`
  }
}
