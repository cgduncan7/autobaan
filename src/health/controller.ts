import { Controller, Get, Inject } from '@nestjs/common'

import { EmailProvider } from '../email/provider'

@Controller('health')
export class HealthController {
	constructor(
		@Inject(EmailProvider)
		private emailProvider: EmailProvider,
	) {}

	@Get()
	getHealth() {
		return this.emailProvider.isConnected()
	}
}
