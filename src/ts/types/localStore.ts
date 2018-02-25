import levelup from 'levelup'
import leveljs from 'level-js'

import promisify from 'js-promisify'

import Storable from 'types/storable'

export default class LocalStore<T> {
  data: T
  defaults: any
  db: LevelUp

  constructor(repo: string, data?: T, defaults?: any) {
    this.db = levelup(repo, {db: leveljs})
    this.data = data || <any>{}
    this.defaults = defaults || <any>{}
  }

  static from<T extends Storable>(obj: T) {
    return new LocalStore<T>(obj.path(), obj, obj.defaults())
  }

  async load() {
    if (this.defaults) {
      for (const prop in this.defaults) {
        if (!(<any>this.data)[prop]) (<any>this.data)[prop] = this.defaults[prop]
      }
    }
    const temp: any = {}
    await Promise.all(Object.keys(this.data).map(async key => {
      const val = await this.getResolve<any>(key)
      console.log(temp)
      if (val !== undefined) temp[key] = val
    }))
    Object.assign(this.data, temp)
    console.log("done loading", this.data)
  }
  async save() {
    const batch = this.batchChain()
    Object.entries(this.data).forEach(([key, val]) => {
      batch.put(key, JSON.stringify(val))
    })
    await batch.write()
  }

  put(key: any, value: any): Promise<any> {
    return promisify(this.db.put, [key, JSON.stringify(value)], this.db)
  }
  get(key: any): Promise<string> {
    return promisify(this.db.get, [key], this.db)
  }
  del(key: any): Promise<void> {
    return promisify(this.db.del, [key], this.db)
  }
  batch(ops?: Operation[]): Promise<void> | Batch {
    if (ops) {
      return promisify(this.db.batch, ops, this.db)
    } else {
      return <Batch>this.db.batch() // this is safe because ops is undefined
    }
  }
  get isOpen(): boolean {
    return this.db.isOpen()
  }
  get isClosed(): boolean {
    return this.db.isClosed()
  }
  createReadStream(options?: StreamOptions): ReadableStream {
    return this.db.createReadStream(options)
  }
  createKeyStream(options?: StreamOptions): ReadableStream {
    return this.db.createKeyStream()
  }
  createValueStream(options?: StreamOptions): ReadableStream {
    return this.db.createValueStream()
  }

  // Convenience methods to avoid explicit type checks and casts
  batchArray(ops: Array<Operation>): Promise<void> {
    return <Promise<void>>this.batch(ops)
  }
  batchChain(): Batch {
    return <Batch>this.batch()
  }
  async getResolve<T>(key: any): Promise<T | undefined> {
    const self = this
    return new Promise<T | undefined>(res => {
      self.get(key).then(
        val => {
          console.log(key, val)
          res(val[0] === '{' || val[0] === '[' || val[0] === '"' ? JSON.parse(val) : val) // """smart""" object detection
        },
        err => res(undefined)
      )
    })
  }
}