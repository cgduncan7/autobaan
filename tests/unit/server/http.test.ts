import axios from 'axios'
import server from '../../../src/server/http'
import * as scheduler from '../../../src/common/scheduler'
import * as utils from '../../../src/server/utils'

const port = Math.round(Math.random() * 50000 + 10000)
const baseUrl = `http://localhost:${port}`

describe('server', () => {
  const consoleLogSpy = jest.fn()
  const consoleErrorSpy = jest.fn()

  beforeAll(() => {
    server.listen(port)
    console.log = consoleLogSpy
    console.error = consoleErrorSpy
  })

  afterAll(() => {
    server.close()
  })

  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('should accept POST to /reservations', async () => {
    jest
      .spyOn(scheduler, 'schedule')
      .mockImplementationOnce(() => Promise.resolve({}))
    const response = await axios.post(
      `${baseUrl}/reservations`,
      {},
      { headers: { 'content-type': 'application/json' } }
    )
    expect(response.status).toBe(200)
  })

  test('should accept POST to /cron', async () => {
    jest
      .spyOn(scheduler, 'schedule')
      .mockImplementationOnce(() => Promise.resolve({}))
    const response = await axios.post(
      `${baseUrl}/cron/disable`,
      {},
      { headers: { 'content-type': 'application/json' } }
    )
    expect(response.status).toBe(200)
  })

  test('should reject request to other route', async () => {
    jest
      .spyOn(scheduler, 'schedule')
      .mockImplementationOnce(() => Promise.resolve({}))
    await expect(() => axios.post(`${baseUrl}/something-else`)).rejects.toThrow(
      axios.AxiosError
    )
  })
})
