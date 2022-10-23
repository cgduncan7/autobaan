import * as password from '../../src/common/password'

describe('password', () => {
  describe('generateSalt', () => {
    test('should generate salt of 32 bytes', async () => {
      const saltBuffer = await password.generateSalt()
      expect(saltBuffer.length).toEqual(32)
    })
  })

  describe('generateHash', () => {
    test('should generate a hash of 64 bytes', async () => {
      const saltBuffer = Buffer.alloc(32, 1)
      const hash = await password.generateHash('abc123', saltBuffer)
      expect(hash).toEqual(
        '$argon2id$v=19$m=16384,t=2,p=1$AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE$jF3SXC/JRI9d1jr48kQkvWaSVlf3XGNSRUCNnNp5IaI'
      )
    })
  })

  describe('hashPassword', () => {
    test('it should create salt and hash password', async () => {
      const hash = await password.hashPassword('abc123')
      expect(hash).toMatch(/^\$argon2id\$v=19\$m=16384,t=2,p=1\$.+$/)
    })
  })
})
