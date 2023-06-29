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

interface RunnerSession {
	username: string
	loggedInAt: Date
}

@Injectable()
export class RunnerService implements OnModuleInit, BeforeApplicationShutdown {
	private browser?: Browser
	private options: LaunchOptions &
		BrowserLaunchArgumentOptions &
		BrowserConnectOptions = {
		args: ['--disable-setuid-sandbox', '--no-sandbox'],
		headless: 'new',
	}
	private session: RunnerSession | null = null

	private async init() {
		try {
			if (!this.browser) {
				this.browser = await puppeteer.launch(this.options)
			}
		} catch (error) {
			throw new PuppeteerBrowserLaunchError(error)
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

	public async getSession(): Promise<RunnerSession | null> {
		return this.session
	}

	public startSession(username: string) {
		if (this.session && this.session.username !== username) {
			throw new RunnerNewSessionError(new Error('Session already started'))
		}

		if (this.session?.username === username) {
			return
		}

		this.session = {
			username,
			loggedInAt: new Date(),
		}
	}

	public endSession() {
		this.session = null
	}
}

export class RunnerError extends Error {
	constructor(error: Error) {
		super(error.message)
		this.stack = error.stack
	}
}
export class PuppeteerError extends RunnerError {}
export class PuppeteerBrowserLaunchError extends PuppeteerError {}
export class PuppeteerNewPageError extends PuppeteerError {}

export class RunnerNewSessionError extends RunnerError {}

export class RunnerLogoutError extends RunnerError {}

export class RunnerLoginNavigationError extends RunnerError {}
export class RunnerLoginUsernameInputError extends RunnerError {}
export class RunnerLoginPasswordInputError extends RunnerError {}
export class RunnerLoginSubmitError extends RunnerError {}

export class RunnerNavigationMonthError extends RunnerError {}
export class RunnerNavigationDayError extends RunnerError {}
export class RunnerNavigationSelectionError extends RunnerError {}

export class RunnerCourtSelectionError extends RunnerError {}
export class NoCourtAvailableError extends Error {}

export class RunnerOpponentSearchError extends RunnerError {}
export class RunnerOpponentSearchInputError extends RunnerError {}
export class RunnerOpponentSearchNetworkError extends RunnerError {}
export class RunnerOpponentSearchSelectionError extends RunnerError {}

export class RunnerReservationConfirmButtonError extends RunnerError {}
export class RunnerReservationConfirmSubmitError extends RunnerError {}
