import 'reflect-metadata'
import { Reservation } from './src/reservations/entity'
import { DataSource } from 'typeorm'


export const AppDataSource = new DataSource({
    type: 'sqlite',
    database: 'autobaan',
    logging: true,
    entities: [Reservation],
    migrations: [],
    subscribers: [],
})
