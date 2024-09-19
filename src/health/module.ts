import { Module } from '@nestjs/common'

import { EmailModule } from '../email/module'
import { HealthController } from './controller'

@Module({
	imports: [EmailModule],
	controllers: [HealthController],
})
export class HealthModule {}
