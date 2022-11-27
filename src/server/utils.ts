import { Readable } from 'stream'

export const parseJson = async <T extends Record<string, unknown>>(
  length: number,
  encoding: BufferEncoding,
  readable: Readable
) => {
  return new Promise<T>((res, rej) => {
    let jsonBuffer: Buffer
    try {
      jsonBuffer = Buffer.alloc(length, encoding)
      readable.setEncoding(encoding)
    } catch (error: any) {
      rej(error)
    }

    readable.on('data', (chunk) => {
      try {
        jsonBuffer.write(chunk, encoding)
      } catch (error: any) {
        rej(error)
      }
    })

    readable.on('end', () => {
      try {
        const jsonObject = JSON.parse(jsonBuffer.toString())
        res(jsonObject)
      } catch (error: any) {
        rej(error)
      }
    })
  })
}
