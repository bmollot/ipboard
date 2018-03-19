type EncodedMultihash = Buffer
interface DecodedMultihash {
  code: number
  name: string
  length: number
  digest: Buffer
}
interface Multihash {
  encode(buf: Buffer, type: 'sha1'): EncodedMultihash
  decode(encoded: EncodedMultihash): DecodedMultihash
  toHexString(hash: EncodedMultihash): string
  fromHexString(hash: string): EncodedMultihash
  toB58String(hash: EncodedMultihash): string
  fromB58String(hash: string | Buffer): EncodedMultihash
  coerceCode(name: string | number): number
  isAppCode(code: number): boolean
  isValidCode(code: number): boolean
  prefix(multihash: EncodedMultihash): undefined // No clue how this works
  validate(multihash: Buffer): undefined // Throws if invalid
}

export {EncodedMultihash, DecodedMultihash, Multihash}