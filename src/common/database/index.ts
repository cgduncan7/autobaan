import mysql, { Connection, ConnectionConfig, FieldInfo } from 'mysql'
import { readFile } from 'fs/promises'
import { resolve } from 'path'
import { TABLE_reservations } from './sql'

const createConnectionConfig = async (): Promise<ConnectionConfig> => {
  const user = await readFile(resolve('.', './secrets/dbUser'))
  const password = await readFile(resolve('.', './secrets/dbPassword'))
  return {
    user: user.toString(),
    password: password.toString(),
    database: 'autobaan',
  }
}

let connection: Connection

export const getConnection = async (): Promise<Connection> => {
  if (!connection) {
    const config = await createConnectionConfig()
    connection = mysql.createConnection(config)
  }
  return connection
}

export type ResultSet<T> = T[]

export const connect = async () => {
  return new Promise<void>((res, rej) =>
    getConnection().then((cn) => {
      cn.connect((err) => {
        if (err) {
          rej(err)
        }
        res()
      })
    })
  )
}

export const disconnect = async () => {
  return new Promise<void>((res, rej) =>
    getConnection().then((cn) => {
      cn.end((err) => {
        if (err) {
          rej(err)
        }
        res()
      })
    })
  )
}

export const query = async <T = unknown, V = unknown>(
  sql: string,
  values?: V
): Promise<{ results: ResultSet<T>; fields?: FieldInfo[] }> => {
  return new Promise((res, rej) => {
    connection.query({ sql, values }, (err, results, fields) => {
      if (err) {
        rej(err)
      }
      res({ results, fields })
    })
  })
}

export const init = async () => {
  try {
    await connect()
    await query(TABLE_reservations)
  } catch (err: any) {
    console.error(err)
  }
}
