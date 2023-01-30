import { IncomingMessage, ServerResponse } from 'http'
import { schedule } from '../../../common/scheduler'
import { asyncLocalStorage as l } from '../../../common/logger'
import { Router } from './index'
import { Reservation } from '../../../common/reservation'
import { parse } from 'querystring'

export class ReservationsRouter extends Router {
  public async handleRequest(
    req: IncomingMessage,
    res: ServerResponse<IncomingMessage>,
  ) {
    const { url = '', method } = req
    const [route] = url.split('?')
    switch (true) {
      case /^\/reservations$/.test(route) && method === 'GET': {
        await this.GET_reservations(req, res)
        break
      }
      case /^\/reservations$/.test(route) && method === 'POST': {
        await this.POST_reservations(req, res)
        break
      }
      case /^\/reservations\/\S+$/.test(route) && method === 'DELETE': {
        await this.DELETE_reservation(req, res)
        break
      }
      default: {
        this.handle404(req, res)
      }
    }
  }

  private async GET_reservations(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {
    const { url = '' } = req
    const [, queryParams] = url.split('?')
    let pageNumber = 0
    let pageSize = 0
    const { pageNumber: rawPageNumber = '0', pageSize: rawPageSize = '50' } = parse(queryParams)
    if (typeof rawPageNumber === 'string') {
      pageNumber = Number.parseInt(rawPageNumber)
    } else {
      pageNumber = 0
    }

    if (typeof rawPageSize === 'string') {
      pageSize = Math.min(Number.parseInt(rawPageSize), 50)
    } else {
      pageSize = 50
    }
    
    l.getStore()?.debug('Fetching reservations', { pageNumber, pageSize })

    try {
      const reservations = await Reservation.fetchByPage(pageNumber, pageSize)
      res.setHeader('content-type', 'application/json')
      l.getStore()?.debug('Found reservations', { reservations: reservations.map((r) => r.toString(true)) })
      return new Promise<void>((resolve, reject) => {
        res.write(`[${reservations.map((r) => r.toString(true)).join(',')}]`, (err) => {
          if (err) {
            reject(err)
          }
          resolve()
        })
      })
    } catch (error) {
      l.getStore()?.error('Failed to get reservations', {
        message: (error as Error).message,
        stack: (error as Error).stack,
      })
      res.writeHead(500)
    }
  }

  private async POST_reservations(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {
    const jsonBody = await this.parseJsonContent(req)
    try {
      await schedule(jsonBody)
    } catch (error: unknown) {
      l.getStore()?.error('Failed to create reservation', {
        message: (error as Error).message,
        stack: (error as Error).stack,
      })
      res.writeHead(400)
    }
  }

  private async DELETE_reservation(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {
    const { url = '' } = req
    const [,,id] = url.split('/')
    l.getStore()?.debug('Deleting reservation', { id })
    try {
      await Reservation.deleteById(id)
      res.writeHead(200)
    } catch (error) {
      l.getStore()?.error('Failed to get reservations', {
        message: (error as Error).message,
        stack: (error as Error).stack,
      })
      res.writeHead(500)
    }
  }
}
