export enum LogLevel {
  DEBUG,
  INFO,
  ERROR,
}

export class Logger {
  private static instance: LoggerInstance

  public static instantiate(
    tag: string,
    correlationId: string,
    level = LogLevel.ERROR
  ): LoggerInstance {
    Logger.instance = new LoggerInstance(tag, correlationId, level)
    return Logger.instance
  }

  public static getInstance(): LoggerInstance {
    return Logger.instance
  }

  public static debug(message: string, details?: unknown): void {
    Logger.getInstance().debug(message, details)
  }

  public static info(message: string, details?: unknown): void {
    Logger.getInstance().info(message, details)
  }

  public static error(message: string, details?: unknown): void {
    Logger.getInstance().error(message, details)
  }
}

export class LoggerInstance {
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

    let fmtString = '<%s> [%s] %s: %s'
    const params: Array<unknown> = [
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
