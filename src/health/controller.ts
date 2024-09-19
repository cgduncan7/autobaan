import {
	Controller,
	Get,
	Inject,
	ServiceUnavailableException,
} from '@nestjs/common'

import { EmailProvider } from '../email/provider'

@Controller('health')
export class HealthController {
	constructor(
		@Inject(EmailProvider)
		private emailProvider: EmailProvider,
	) {}

	@Get()
	getHealth() {
		const checks = [() => this.emailProvider.isConnected()]

		const healthy = checks.every((check) => check())
		if (!healthy) {
			throw new ServiceUnavailableException()
		}
	}
}
