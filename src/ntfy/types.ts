export const NTFY_PUBLISH_QUEUE_NAME = 'ntfy_publish_queue'

export enum MessageTags {
	alarm_clock = 'alarm_clock',
	green_circle = 'green_circle',
	yellow_circle = 'yellow_circle',
	red_circle = 'red_circle',
	info = 'information_source',
	hourglass = 'hourglass',
	warning = 'warning',
	exclamation = 'exclamation',
	question = 'question',
	no_entry = 'no_entry',
	white_check_mark = 'white_check_mark',
	red_x = 'x',
	zero = 'zero',
	one = 'one',
	two = 'two',
	three = 'three',
	four = 'four',
	five = 'five',
	six = 'six',
	seven = 'seven',
	eight = 'eight',
	nine = 'nine',
	new = 'new',
	clock12 = 'clock12',
	clock1230 = 'clock1230',
	clock1 = 'clock1',
	clock130 = 'clock130',
	clock2 = 'clock2',
	clock230 = 'clock230',
	clock3 = 'clock3',
	clock330 = 'clock330',
	clock4 = 'clock4',
	clock430 = 'clock430',
	clock5 = 'clock5',
	clock530 = 'clock530',
	clock6 = 'clock6',
	clock630 = 'clock630',
	clock7 = 'clock7',
	clock730 = 'clock730',
	clock8 = 'clock8',
	clock830 = 'clock830',
	clock9 = 'clock9',
	clock930 = 'clock930',
	clock10 = 'clock10',
	clock1030 = 'clock1030',
	clock11 = 'clock11',
	clock1130 = 'clock1130',
	badminton = 'badminton',
}

export enum MessagePriority {
	min = 1,
	low = 2,
	default = 3,
	high = 4,
	max = 5,
}

export interface MessageConfig {
	topic: string
	message?: string
	title?: string
	tags?: MessageTags[]
	priority?: MessagePriority
	actions?: object[]
	markdown?: boolean
	icon?: string
}
