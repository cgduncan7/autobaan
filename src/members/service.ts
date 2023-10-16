import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Axios } from 'axios'
import { stringify } from 'querystring'

import { LoggerService } from '../logger/service.logger'

export class Member {
	id: string
	name: string

	constructor(id: number, name: string) {
		this.id = `${id}`
		this.name = name
	}
}

interface MembersResponse {
	members: [number, string][]
	count: number
	max: number
	total: number
	queries: unknown[]
}

@Injectable()
export class MembersService {
	private readonly membersClient: Axios
	private sessionCookie: string
	constructor(
		@Inject(LoggerService)
		private readonly loggerService: LoggerService,

		@Inject(ConfigService)
		private readonly configService: ConfigService,
	) {
		this.sessionCookie = this.generateSessionCookie()
		this.membersClient = new Axios({
			baseURL: 'https://squashcity.baanreserveren.nl/',
			headers: {
				Accept: 'application/json',
				Cookie: this.sessionCookie,
			},
		})
	}

	private generateSessionCookie(): string {
		const length = 26
		const acceptedChars = 'abcdefghijklmnopqrstuvwxyz0123456789'
		let sessionCookie = `PHPSESSID=`
		for (let i = 0; i < length; i++) {
			sessionCookie +=
				acceptedChars[Math.floor(Math.random() * acceptedChars.length)]
		}
		return sessionCookie
	}

	private sanitizeName(name: string): string {
		const memberIdRegex = /\(P[0-9]+\)/
		return name.replace(memberIdRegex, '').trim()
	}

	private async login(): Promise<void> {
		const username = this.configService.getOrThrow<string>(
			'BAANRESERVEREN_USERNAME',
		)
		const password = this.configService.getOrThrow<string>(
			'BAANRESERVEREN_PASSWORD',
		)

		await this.membersClient.post(
			'/auth/login',
			stringify({ username, password }),
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			},
		)
	}

	async findMembers(query: string, redirected = false): Promise<Member[]> {
		this.loggerService.debug('Finding members', { query })
		const response = await this.membersClient.get<string>(
			'/members/find/ajax',
			{
				headers: {
					Accept: 'text/html',
				},
				params: { query },
				maxRedirects: 0,
			},
		)
		if (!redirected && response.status >= 300 && response.status < 400) {
			this.loggerService.log('Not logged in, logging in and re-requesting')
			await this.login()
			return await this.findMembers(query, true)
		}
		const jsonData: MembersResponse = JSON.parse(response.data)
		this.loggerService.debug('Found members', { ...jsonData })
		return jsonData.members.map(
			([id, name]) => new Member(id, this.sanitizeName(name)),
		)
	}
}
