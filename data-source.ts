import { resolve } from 'path'
import { DataSource } from 'typeorm'

export const AppDataSource = new DataSource({
	type: 'sqlite',
	database: resolve('./db/autobaan_db'),
	logging: true,
	entities: [resolve('./src/reservations/entity.ts')],
	migrations: [resolve('./database/migrations/*.ts')],
	subscribers: [],
})
