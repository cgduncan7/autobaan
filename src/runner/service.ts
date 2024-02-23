import {
	BeforeApplicationShutdown,
	Injectable,
	OnModuleInit,
} from '@nestjs/common'
import puppeteer, {
	Browser,
	BrowserConnectOptions,
	BrowserLaunchArgumentOptions,
	LaunchOptions,
} from 'puppeteer'

@Injectable()
export class RunnerService implements OnModuleInit, BeforeApplicationShutdown {
	private browser?: Browser
	private options: LaunchOptions &
		BrowserLaunchArgumentOptions &
		BrowserConnectOptions = {
		args: ['--disable-setuid-sandbox', '--no-sandbox'],
		headless: 'new',
	}

	private async init() {
		if (!this.browser) {
			this.browser = await puppeteer.launch(this.options)
		}
	}

	public async onModuleInit() {
		await this.init()
	}

	public async beforeApplicationShutdown() {
		try {
			if (this.browser && this.browser.isConnected()) {
				await this.browser.close()
			}
		} catch (error) {
			console.error('error shutting down browser', error)
		}
	}

	public async getBrowser(): Promise<Browser> {
		await this.init()
		if (!this.browser) {
			throw new Error('Browser not initialized')
		}
		return this.browser
	}
}
