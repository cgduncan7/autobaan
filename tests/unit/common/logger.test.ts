import { Logger, LogLevel } from '../../../src/common/logger'

describe('Logger', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('should log messages', () => {
    const consoleLogSpy = jest.fn()
    const consoleErrorSpy = jest.fn()
    jest.spyOn(console, 'log').mockImplementation(consoleLogSpy)
    jest.spyOn(console, 'error').mockImplementation(consoleErrorSpy)

    const logger = new Logger('tag', 'abc', LogLevel.DEBUG)
    logger.debug('first')
    logger.info('second')
    logger.error('third', { errorMessage: 'test' })

    expect(consoleLogSpy).toHaveBeenCalledTimes(2)
    expect(consoleLogSpy).toHaveBeenNthCalledWith(
      1,
      '<%s> [%s] %s: %s',
      'tag',
      'abc',
      'DEBUG',
      'first'
    )
    expect(consoleLogSpy).toHaveBeenNthCalledWith(
      2,
      '<%s> [%s] %s: %s',
      'tag',
      'abc',
      'INFO',
      'second'
    )
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '<%s> [%s] %s: %s - %O',
      'tag',
      'abc',
      'ERROR',
      'third',
      { errorMessage: 'test' }
    )
  })

  test('should log only when level is >= LogLevel of LoggerInstance', () => {
    const consoleLogSpy = jest.fn()
    jest.spyOn(console, 'log').mockImplementationOnce(consoleLogSpy)

    const logger = new Logger('tag', 'abc', LogLevel.INFO)
    logger.debug("shouldn't appear")

    expect(consoleLogSpy).not.toHaveBeenCalled()
  })

  test('should obfuscate password from message', () => {
    const consoleLogSpy = jest.fn()
    const consoleErrorSpy = jest.fn()
    jest.spyOn(console, 'log').mockImplementation(consoleLogSpy)
    jest.spyOn(console, 'error').mockImplementation(consoleErrorSpy)

    const logger = new Logger('tag', 'abc', LogLevel.DEBUG)
    logger.info('first', { password: 'test' })

    expect(consoleLogSpy).toHaveBeenCalledTimes(1)
    expect(consoleLogSpy).toHaveBeenNthCalledWith(
      1,
      '<%s> [%s] %s: %s - %O',
      'tag',
      'abc',
      'INFO',
      'first',
      { password: '***' }
    )
  })
})
