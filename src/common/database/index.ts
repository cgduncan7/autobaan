import { resolve } from 'path'
import sqlite from 'sqlite3'
import { asyncLocalStorage } from '../logger'
import { CREATE_TABLE_reservations } from './sql'

export const run = async (sql: string, params?: unknown) => {
  const db = new sqlite.Database(resolve('autobaan_db'))
  await new Promise<void>((res, rej) => {
    asyncLocalStorage.getStore()?.debug(`<database> run ${sql} (${params})`)
    db.run(sql, params, (err) => {
      if (err) rej(err)
      res()
    })
  })
  db.close()
}

export const all = async <T>(sql: string, params?: unknown) => {
  const db = new sqlite.Database(resolve('autobaan_db'))
  const rows = await new Promise<T[]>((res, rej) => {
    asyncLocalStorage.getStore()?.debug(`<database> all ${sql} (${params})`)
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
