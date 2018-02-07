import RNG from 'types/rng'
import Thread from 'types/thread'

export default class PostProcessorEnvironment {
  kv: {
    self: Thread
    nodeId: string
    [key: string]: any
  }

  constructor(public rng: RNG, initKv?: any) {
    this.kv = initKv || {}
  }
}