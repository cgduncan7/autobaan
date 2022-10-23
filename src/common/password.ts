import argon2 from 'argon2'
import crypto from 'crypto'
import { Logger } from './logger'

const SALT_LENGTH = Number.parseInt(process.env.SALT_LENGTH || '32', 10)

const randomFillPromise = (buffer: Buffer) => {
  return new Promise<Buffer>((res, rej) => {
    crypto.randomFill(buffer, (err, buff) => {
      if (err) {
        rej(err)
      }
      res(buff)
    })
  })
}

export const generateSalt = async () => {
  const saltBuffer = Buffer.alloc(SALT_LENGTH)
  return randomFillPromise(saltBuffer)
}

export const generateHash = async (password: string, saltBuffer: Buffer) => {
  const hashOptions: argon2.Options & { raw: false } = {
    hashLength: 32,
    parallelism: 1,
    memoryCost: 1 << 14,
    timeCost: 2,
    type: argon2.argon2id,
    salt: saltBuffer,
    saltLength: saltBuffer.length,
    raw: false,
  }

  const hash = await argon2.hash(password, hashOptions)
  return hash
}

export const hashPassword = async (password: string) => {
  try {
    const saltBuffer = await generateSalt()
    const hash = await generateHash(password, saltBuffer)
    return hash
  } catch (err: any) {
    Logger.error('Error hashing and salting password', { message: err.message })
    throw err
  }
}

export const verifyPassword = async (hash: string, password: string) => {
  return await argon2.verify(hash, password)
}
