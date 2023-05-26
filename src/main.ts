import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { CustomResponseTransformInterceptor } from './common/customResponse'

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { abortOnError: false })
	const config = app.get(ConfigService)
	const port = config.get('PORT')
	app.enableShutdownHooks()
	app.useGlobalInterceptors(new CustomResponseTransformInterceptor())
	await app.listen(port)
}

bootstrap()
