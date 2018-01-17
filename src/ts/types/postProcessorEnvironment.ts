import RNG from 'types/rng'

export default class PostProcessorEnvironment {
  kv: any

  constructor(public rng: RNG, initKv?: any) {
    this.kv = initKv || {}
  }
}