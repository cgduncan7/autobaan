import { resolve } from 'path'
import sqlite from 'sqlite3'
import { asyncLocalStorage } from '../logger'
import { CREATE_TABLE_reservations } from './sql'

const getDatabase = () => new sqlite.Database(resolve('./db/autobaan_db'))

export const run = async (sql: string, params?: unknown) => {
  const db = getDatabase()
  await new Promise<void>((res, rej) => {
    asyncLocalStorage.getStore()?.debug(`<database> run ~> ${sql.replace(/\s*\n\s*/g, ' ')} (${params})`)
    db.run(sql, params, (err) => {
      if (err) rej(err)
      res()
    })
  })
  db.close()
}

export const all = async <T>(sql: string, params?: unknown) => {
  const db = getDatabase()
  const rows = await new Promise<T[]>((res, rej) => {
    asyncLocalStorage.getStore()?.debug(`<database> all ~> ${sql.replace(/\s*\n\s*/g, ' ')} (${params})`)
    db.all(sql, params, (err, rows) => {
      if (err) rej(err)
      res(rows)
    })
  }
  )
  db.close()
  return rows
}

export const init = async () => {
  try {
    await run(CREATE_TABLE_reservations)
  } catch (err: unknown) {
    console.error(err)
  }
}

export class DatabaseError extends Error {}
export class DatabaseEnvironmentError extends DatabaseError {}
