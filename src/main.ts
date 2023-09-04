import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'

import { AppModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		abortOnError: false,
	})
	const config = app.get(ConfigService)
	const port = config.get('PORT', 3000)
	app.enableShutdownHooks()
	await app.listen(port, () => console.log(`Listening on port ${port}`))
}

bootstrap()
