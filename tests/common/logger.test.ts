import { Logger, LogLevel } from '../../src/common/logger'

describe('Logger', () => {
  test('should create a single instance of LoggerInstance', () => {
    const a = Logger.instantiate('tag', 'abc', LogLevel.DEBUG)
    const b = Logger.getInstance()

    expect(a).toStrictEqual(b)
  })

  test('should log messages', () => {
    const consoleLogSpy = jest.fn()
    const consoleErrorSpy = jest.fn()
    jest.spyOn(console, 'log').mockImplementation(consoleLogSpy)
    jest.spyOn(console, 'error').mockImplementation(consoleErrorSpy)

    Logger.instantiate('tag', 'abc', LogLevel.DEBUG)
    Logger.debug('first')
    Logger.info('second')
    Logger.error('third', { errorMessage: 'test' })

    expect(consoleLogSpy).toHaveBeenCalledTimes(2)
    expect(consoleLogSpy).toHaveBeenNthCalledWith(
      1, '<%s> [%s] %s: %s', 'tag', 'abc', 'DEBUG', 'first'
    )
    expect(consoleLogSpy).toHaveBeenNthCalledWith(
      2, '<%s> [%s] %s: %s', 'tag', 'abc', 'INFO', 'second'
    )
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '<%s> [%s] %s: %s - %O', 'tag', 'abc', 'ERROR', 'third', { "errorMessage": "test" }
    )
  })

  test('should log only when level is >= LogLevel of LoggerInstance', () => {
    const consoleLogSpy = jest.fn()
    jest.spyOn(console, 'log').mockImplementationOnce(consoleLogSpy)
    
    Logger.instantiate('tag', 'abc', LogLevel.INFO)
    Logger.debug('should\'t appear')

    expect(consoleLogSpy).not.toHaveBeenCalled()
  })
})