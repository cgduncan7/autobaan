import { FactoryProvider, Scope } from '@nestjs/common'
import { Page } from 'puppeteer'

import { RunnerService } from '../service'

export const EmptyPage = Symbol.for('EmptyPage')

export const EmptyPageFactory: FactoryProvider<Page> = {
	provide: EmptyPage,
	useFactory: async (runnerService: RunnerService) => {
		const browser = await runnerService.getBrowser()
		const page = await browser.newPage()

		// Default navigation timeout and loading timeout of 5s
		page.setDefaultNavigationTimeout(5_000)
		page.setDefaultTimeout(5_000)

		return page
	},
	inject: [RunnerService],
	scope: Scope.TRANSIENT,
}
