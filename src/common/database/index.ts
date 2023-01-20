import mysql, { Connection, ConnectionConfig, FieldInfo } from 'mysql'
import { TABLE_reservations } from './sql'

const createConnectionConfig = async (): Promise<ConnectionConfig> => {
  const host = process.env.MYSQL_HOST
  const user = process.env.MYSQL_USER
  const password = process.env.MYSQL_PASSWORD
  const database = process.env.MYSQL_DATABASE
  if (!user || !password || !database) {
    throw new DatabaseEnvironmentError(
      'Required environment variables are missing'
    )
  }
  return {
    host,
    user,
    password,
    database,
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

export class DatabaseError extends Error {}
export class DatabaseEnvironmentError extends DatabaseError {}
