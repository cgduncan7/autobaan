import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import { CustomResponseTransformInterceptor } from './common/customResponse'

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { abortOnError: false })
	const config = app.get(ConfigService)
	const port = config.get('PORT', 3000)
	app.enableShutdownHooks()
	app.useGlobalPipes(new ValidationPipe())
	app.useGlobalInterceptors(new CustomResponseTransformInterceptor())
	await app.listen(port, () => console.log(`Listening on port ${port}`))
}

bootstrap()
