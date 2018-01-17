interface RNG {
  next: () => number
}
class RNG implements RNG {
  next: () => number

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
  /**
   * "Stretches" the output of a random number generator to an **integer** in the specified range.
   * min is inclusive, max is exclusive.
   * @param randNum Value to be streched. Between 0 inclusive and 1 exclusive.
   * @param min Minimum value or return. Rounded up to nearest integer.
   * @param max First value outside of the range. Rounded down to the nearest integer
   * @returns randNum "stretched" to an integer.
   */
  static range(randNum: number, min: number, max: number) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(randNum * (max - min)) + min
  }

  /**
   * Generates a random integer in the specified range.
   * @param min Inclusive. Rounded up to nearest integer.
   * @param max Exclusive. Rounded down to nearest integer.
   */
  nextRange(min: number, max: number): number {
    return RNG.range(this.next(), min, max)
  }
}

type PRG = (seed: number) => RNG

export {PRG}
export default RNG
