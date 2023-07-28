import { Dayjs } from 'dayjs'

export interface Email {
	id: number
	date: Dayjs
	body: string
}
