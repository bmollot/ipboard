import RNG from 'types/rng'

/*
 * Stolen shamelessly from https://stackoverflow.com/a/19301306
 * Author based it on https://en.wikipedia.org/wiki/Multiply-with-carry
 * Reformatted into a generator by @iz
 */

export default class MWC extends RNG {
  m_w: number
  m_z: number
  mask: number
  last: number

  constructor(public seed: number) {
    super()
    this.m_w = seed
    this.m_z = 987654321
    this.mask = 0xffffffff
    this.last = 0
  }
  
  /**
   * Generates the next random number.
   * Mutates state.
   */
  next = (): number => {
    this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & this.mask
    this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & this.mask
    let result = ((this.m_z << 16) + this.m_w) & this.mask
    result /= 4294967296
    result += 0.5
    this.last = result
    return result
  }
}