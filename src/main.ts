import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import { CustomResponseTransformInterceptor } from './common/customResponse'
import { setDefaults } from './common/dayjs'

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		abortOnError: false,
		logger: ['error', 'warn', 'log'],
	})
	const config = app.get(ConfigService)
	const port = config.get('PORT', 3000)
	app.enableShutdownHooks()
	app.useGlobalPipes(new ValidationPipe({ transform: true }))
	app.useGlobalInterceptors(new CustomResponseTransformInterceptor())
	setDefaults()
	await app.listen(port, () => console.log(`Listening on port ${port}`))
}

bootstrap()
