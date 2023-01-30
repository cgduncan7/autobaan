import { IncomingMessage, ServerResponse } from 'http'
import { asyncLocalStorage, asyncLocalStorage as l, LoggableError } from '../../../common/logger'
import { parseJson } from '../../utils'

export abstract class Router {
  protected async parseJsonContent(
    req: IncomingMessage,
  ) {
    let jsonBody: Record<string, unknown>
    const contentType =
      req.headers['content-type'] || 'application/json'
    if (contentType !== 'application/json') {
      l.getStore()?.error('Invalid content type', { contentType })
      throw new RouterUnsupportedContentTypeError()
    }

    try {
      const length = Number.parseInt(
        req.headers['content-length'] || '0'
      )
      const encoding = req.readableEncoding || 'utf8'
      jsonBody = await parseJson(length, encoding, req)
    } catch (error: unknown) {
      l.getStore()?.error('Failed to parse body', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      })
      throw new RouterBadRequestError()
    }

    return jsonBody
  }

  protected handle404(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {
    const { url, method } = req
    asyncLocalStorage.getStore()?.info('Not found', { url, method })
    res.writeHead(404, 'Not found')
  }

  public abstract handleRequest(
    req: IncomingMessage,
    res: ServerResponse<IncomingMessage>,
  ): Promise<void>
}

export class RouterError extends LoggableError {}
export class RouterBadRequestError extends RouterError {}
export class RouterUnsupportedContentTypeError extends RouterError {}