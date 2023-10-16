import { Controller, Get, Inject, Query } from '@nestjs/common'

import { MembersService } from './service'

@Controller('members')
export class MembersController {
	constructor(
		@Inject(MembersService)
		private readonly membersService: MembersService,
	) {}

	@Get()
	async getMembers(@Query('name') name?: string) {
		if (name == null || name.length == 0) return []
		return await this.membersService.findMembers(name)
	}
}
