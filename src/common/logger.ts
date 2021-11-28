export enum LogLevel {
  DEBUG,
  INFO,
  ERROR,
}

export class Logger {
  private readonly correlationId: string
  private readonly level: LogLevel

  constructor(correlationId: string, level = LogLevel.ERROR) {
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

    let fmtString = '[%s] %s: %s'
    const params: Array<unknown> = [this.correlationId, levelString, message]
    if (details) {
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
