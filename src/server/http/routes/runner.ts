import { IncomingMessage, ServerResponse } from 'http'
import { asyncLocalStorage as l } from '../../../common/logger'
import { Router } from './index'
import { getStatus, startTasks, stopTasks } from '../../cron'
import { Runner } from '../../../common/runner'

export class RunnerRouter extends Router {
  public async handleRequest(
    req: IncomingMessage,
    res: ServerResponse<IncomingMessage>
  ) {
    const { url = '', method } = req
    const [route] = url.split('?')
    switch (true) {
      case /^\/runner\/test$/.test(route) && method === 'GET': {
        await this.GET_runner_test(req, res)
        break
      }
      default: {
        this.handle404(req, res)
      }
    }
  }

  private async GET_runner_test(
    _req: IncomingMessage,
    res: ServerResponse<IncomingMessage>
  ) {
    try {
      await new Runner({ headless: false }).test()
      res.writeHead(200, 'OK')
    } catch (e) {
      res.writeHead(500, 'Internal server error')
    }
  }
}
