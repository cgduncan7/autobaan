import { Inject, Injectable } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { ExpressAdapter } from '@nestjs/platform-express'
import { Eta } from 'eta'
import { join } from 'path'

@Injectable()
export class ClientService {
	private readonly eta: Eta
	constructor(
		@Inject(HttpAdapterHost)
		private readonly adapterHost: HttpAdapterHost<ExpressAdapter>,
	) {
		this.eta = new Eta({ views: join(__dirname, 'templates'), cache: true })
		this.adapterHost.httpAdapter.setViewEngine('eta')
		this.adapterHost.httpAdapter.engine('eta', this.eta.render)
	}

	render(template: string, data: Record<string, unknown>) {
		return this.eta.render(template, data)
	}
}
