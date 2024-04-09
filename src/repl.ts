import { repl } from '@nestjs/core'

import { AppModule } from './app.module'
import { setDefaults } from './common/dayjs'

async function bootstrap() {
	setDefaults()
	await repl(AppModule)
}
bootstrap()
