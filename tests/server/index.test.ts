import axios from 'axios'
import server from '../../src/server/index'
import * as scheduler from '../../src/common/scheduler'
import * as utils from '../../src/server/utils'

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

  it('should accept POST to /reservations', async () => {
    jest
      .spyOn(scheduler, 'work')
      .mockImplementationOnce(() => Promise.resolve({}))
    const response = await axios.post(
      `${baseUrl}/reservations`,
      {},
      { headers: { 'content-type': 'application/json' } }
    )
    expect(response.status).toBe(200)
  })

  it('should reject non-POST request', async () => {
    jest
      .spyOn(scheduler, 'work')
      .mockImplementationOnce(() => Promise.resolve({}))
    await expect(() => axios.get(`${baseUrl}/reservations`)).rejects.toThrow(
      axios.AxiosError
    )
  })

  it('should reject request to other route', async () => {
    jest
      .spyOn(scheduler, 'work')
      .mockImplementationOnce(() => Promise.resolve({}))
    await expect(() => axios.post(`${baseUrl}/something-else`)).rejects.toThrow(
      axios.AxiosError
    )
  })

  it('should reject request without content-type of json', async () => {
    jest
      .spyOn(scheduler, 'work')
      .mockImplementationOnce(() => Promise.resolve({}))
    await expect(() =>
      axios.post(`${baseUrl}/reservations`, 'test,123', {
        headers: { 'content-type': 'text/csv' },
      })
    ).rejects.toThrow(axios.AxiosError)
  })

  it('should reject request if body cannot be parsed', async () => {
    jest.spyOn(utils, 'parseJson').mockImplementationOnce(Promise.reject)
    await expect(() =>
      axios.post(
        `${baseUrl}/reservations`,
        {},
        {
          headers: { 'content-type': 'application/json' },
        }
      )
    ).rejects.toThrow(axios.AxiosError)
  })

  it('should reject request if schedule cannot be performed', async () => {
    jest.spyOn(scheduler, 'work').mockImplementationOnce(Promise.reject)
    await expect(() =>
      axios.post(
        `${baseUrl}/reservations`,
        {},
        {
          headers: { 'content-type': 'application/json' },
        }
      )
    ).rejects.toThrow(axios.AxiosError)
  })
})
