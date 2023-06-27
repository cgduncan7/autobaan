import { DataSource } from 'typeorm'

export const AppDataSource = new DataSource({
	type: 'sqlite',
	database: './db/autobaan_db',
	logging: true,
	entities: ['./src/**/*.entity.ts'],
	migrations: ['./database/migrations/*.ts'],
	subscribers: [],
})
