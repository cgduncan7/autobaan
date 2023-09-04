import { Controller, Get, Inject, Param, Res } from '@nestjs/common'
import { Response } from 'express'
import { join } from 'path'

import { ClientService } from './service'

@Controller('/')
export class ClientController {
	constructor(
		@Inject(ClientService)
		private readonly clientService: ClientService,
	) {}
	@Get()
	root() {
		return this.clientService.render('pages/index', { name: 'test' })
	}

	@Get('stylesheets/:filename')
	async stylesheet(@Param('filename') filename: string, @Res() res: Response) {
		res.setHeader('content-type', 'text/css')
		res.sendFile(join(__dirname, 'stylesheets', filename))
	}
}
