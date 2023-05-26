import { FactoryProvider, Scope } from '@nestjs/common'
import { RunnerService } from '../service'
import { Page } from 'puppeteer'

export const EmptyPage = Symbol.for('EmptyPage')

export const EmptyPageFactory: FactoryProvider<Page> = {
  provide: EmptyPage, 
  useFactory: async (runnerService: RunnerService) => {
    const browser = await runnerService.getBrowser()
    const page = await browser.newPage()

    return page
  },
  inject: [RunnerService],
  scope: Scope.TRANSIENT,
}
