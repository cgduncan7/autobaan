import { IncomingMessage, ServerResponse } from 'http'
import { asyncLocalStorage as l } from '../../../common/logger'
import { Router } from './index'
import { startTasks, stopTasks } from '../../cron'

export class CronRouter extends Router {
  public async handleRequest(
    req: IncomingMessage,
    res: ServerResponse<IncomingMessage>,
  ) {
    const { url = '', method } = req
    const [route] = url.split('?')
    switch (true) {
      case /^\/cron\/enable$/.test(route) && method === 'POST': {
        await this.POST_cron_enable(req, res)
        break
      }
      case /^\/cron\/disable$/.test(route) && method === 'POST': {
        await this.POST_cron_disable(req, res)
        break
      }
      default: {
        this.handle404(req, res)
      }
    }
  }

  private async POST_cron_enable(
    _req: IncomingMessage,
    res: ServerResponse<IncomingMessage>,
  ) {
    l.getStore()?.debug('Enabling cron')
    startTasks()
    res.writeHead(200)
  }

  private async POST_cron_disable(
    _req: IncomingMessage,
    res: ServerResponse<IncomingMessage>,
  ) {
    l.getStore()?.debug('Disabling cron')
    stopTasks()
    res.writeHead(200)
  }
}
