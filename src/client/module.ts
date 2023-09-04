import { Module } from '@nestjs/common'

import { ClientController } from './controller'
import { ClientService } from './service'

@Module({
	controllers: [ClientController],
	providers: [ClientService],
	imports: [],
})
export class ClientModule {}
