// Imports aren't allowed, so copy/paste? I need EventEmitter's def here
declare class EventEmitter {
  static listenerCount(emitter: EventEmitter, event: string | symbol): number; // deprecated
  static defaultMaxListeners: number;

  addListener(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this;
  once(event: string | symbol, listener: (...args: any[]) => void): this;
  prependListener(event: string | symbol, listener: (...args: any[]) => void): this;
  prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
  removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
  removeAllListeners(event?: string | symbol): this;
  setMaxListeners(n: number): this;
  getMaxListeners(): number;
  listeners(event: string | symbol): Function[];
  emit(event: string | symbol, ...args: any[]): boolean;
  eventNames(): Array<string | symbol>;
  listenerCount(type: string | symbol): number;
}

interface LevelDown {}
declare module 'level-js' {
  const leveljs: LevelDown
  export default leveljs
}

interface PutOperation {
  id?: 'put'
  key: any
  value: any
}
interface DelOperation {
  id: 'del'
  key: any
}
type Operation = PutOperation | DelOperation

interface Batch {
  put(key: any, value: any): void
  del(key: any): void
  clear(): void
  write(): Promise<void>
}

type EventType = 'put' | 'del' | 'batch' | 'opening' | 'open' | 'ready' | 'closing' | 'closed'

interface LevelUpOptions {
  db: LevelDown
}

interface StreamOptions {
  gt?: any
  gte?: any
  lt?: any
  lte?: any
  reverse?: boolean
  limit?: number
  keys?: boolean
  values?: boolean
}

type CallBack = (err?: Error, data?: any) => any

declare interface LevelUp extends EventEmitter {
  put(key: any, value: any, cb: CallBack): void
  get(key: any, cb: CallBack): void
  del(key: any, cb: CallBack): void
  batch(ops?: Operation[], cb?: CallBack): void | Batch
  isOpen(): boolean
  isClosed(): boolean
  createReadStream(options?: StreamOptions): ReadableStream
  createKeyStream(options?: StreamOptions): ReadableStream
  createValueStream(options?: StreamOptions): ReadableStream
}
declare module 'levelup' {
  export default function(repo: string, options: LevelUpOptions): LevelUp
}

type FunctionWithCallBack = (...args: any[]) => any
declare module 'js-promisify' {
  export default function(fun: FunctionWithCallBack, args: any[], self?: any): Promise<any>
}