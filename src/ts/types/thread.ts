import MWC from 'utils/mwc'
import hashCode from 'utils/hashCode'
import escapeHtml from 'utils/escapeHtml'

import {PostProcessor} from 'types/postProcessor'
import PPE from 'types/postProcessorEnvironment'
import {UnPost, Post} from 'types/post'

import * as basePostProcessors from 'ts/basePostProcessors'

// Currently coupled tightly with Vuex store, probably not the best design pattern
import store from 'ts/store'

import * as _ from 'lodash'
import { defaultProfile, Profile } from 'types/profile';

export default class Thread {
  posts: Array<Post>
  synced: string[]
  lastSeen = <any>{} // id: string => timestamp: number
  address: string
  postProcessors: Array<PostProcessor>
  _timeUntilDesynced = 10000 // milliseconds
  _log: any
  _syncedHandle: number
  _pubsub: any
  _nodeInfo: any
  _pubSubHandlerInstance: any

  constructor(public id: string, postProcessors?: Array<PostProcessor>) {
    this.posts = []
    this.synced = []
    this.address = ""
    this.postProcessors = postProcessors || _.values(basePostProcessors)
  }
  // Must be called before the thread can be used. Needed in addition to
  // Constructor because constructors must be syncronous. Consider a pattern
  // with a psuedo-constructor that returns a Promise<Thread> as the only
  // public construction method.
  async _initLog(db: any) {
    let log = this._log = await db.eventlog(this.id, {write: ['*']})
    this.address = log.address.toString()
    log.events.on('replicated', this.onEntryHandler.bind(this))
    log.events.on('write', this.onEntryHandler.bind(this))
    this._pubSubHandlerInstance = this._pubSubHandler.bind(this)
    this._pubsub.subscribe(this.address, this._pubSubHandlerInstance)
  }
  async _initOther(db: any) {
    const self = this
    this._nodeInfo = await new Promise((resolve, reject) => {
      db._ipfs.id((err: Error, info: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(info)
        }
      })
    })
    const syncFunction = async () => {
      self.synced = await self._pubsub.peers(self.address)
      self._syncedHandle = window.setTimeout(syncFunction, self._timeUntilDesynced)
    }
    this._syncedHandle = window.setTimeout(syncFunction, self._timeUntilDesynced)
  }
  /**
   * Must be called before the thread can be used. Needed in addition to
   * constructor because constructors must be syncronous. Consider a pattern
   * with a psuedo-constructor that returns a Promise<Thread> as the only
   * public construction method.
   * 
   * @param db An OrbitDB instance
   * @returns Promise<Promise<void>>. Intentionally tiered promise.
   *          The outer promise resolves when the Thread is ready for use.
   *          The inner promise resolves when the Thread is performant.
   *          The inner promise is almost meaningless atm, feel free to only await
   *          the outer one.
   */
  async init(db: any) {
    // Synchonous
    this._pubsub = db._ipfs.pubsub
    // Parallel async inits (so performance)
    await Promise.all([
      this._initLog.bind(this, db)(),
      this._initOther.bind(this, db)(),
    ])
    // Optional extra await
    return this._log.load() // This just boosts perf when complete, no need to wait
  }
  post(msg: string, profile?: Profile) {
    let post: UnPost = {
      kind: "Post",
      timestamp: Date.now(),
      text: msg,
      profile,
    }
    return this._log.add(post)
  }
  onEntryHandler() {
    let entries = this._log.iterator({limit: -1}).collect() // TODO Use a gt to prevent recollecting already parsed posts
    console.log("REPLICATED", entries)
    const temp = []
    for (let entry of entries) {
      if (entry.payload.value.kind === 'Post')
        temp.push(this.entryToPost(entry))
      else if (entry.payload.value.kind === 'Heartbeat')
        this.lastSeen[entry.id] = entry.payload.value.timestamp
    }
    this.posts = temp
  }
  async destroy() {
    this._pubsub.unsubscribe(this.address, this._pubSubHandlerInstance)
    if (this._syncedHandle) window.clearTimeout(this._syncedHandle)
    await this._log.drop()
    await this._log.close()
  }
  entryToPost(entry: any): Post {
    const myId = this._nodeInfo.id
    let v: UnPost = entry.payload.value
    let post: Post = Object.assign({}, v, {
      id: entry.hash,
      fromId: entry.id,
      profile: Object.assign({}, defaultProfile, v.profile),
      notes: [],
    })
    if (entry.id === myId) post.profile.nickName += " (You)" // TODO make not a hack
    return this.processPost(post)
  }
  processPost(post: Post): Post {
    let seed = hashCode(post.id)
    let rng = new MWC(seed)
    let env = new PPE(rng, {
      processors: this.postProcessors
    })
    this.postProcessors.reduce((p, pp, i) => {
      env.kv['index'] = i
      return pp(p, env)
    }, post)
    return post
  }
  _pubSubHandler() {}
}
