import MWC from 'utils/mwc'
import hashCode from 'utils/hashCode'
import escapeHtml from 'utils/escapeHtml'

import {PostProcessor} from 'types/postProcessor'
import PPE from 'types/postProcessorEnvironment'
import {UnPost, Post, Note} from 'types/post'

import * as basePostProcessors from 'ts/basePostProcessors'

import * as _ from 'lodash'
import { defaultProfile, Profile } from 'types/profile'
import {MAX_UNPOST_SIZE_BYTES, MAX_POST_SIZE_BYTES} from 'ts/constants'

interface String_Post {
  [id: string]: Post
}
interface String_Notes {
  [id: string]: Note[]
}

export default class Thread {
  id: string
  posts: Post[] = []
  synced: string[] = []
  address: string = ""
  backlogReplicated: boolean = false
  postProcessors: PostProcessor[]
  _backNotes: String_Notes = {}
  _postById: String_Post = {}
  _haveNeededPosts: boolean = false
  _timeUntilDesynced = 10000 // milliseconds
  _log: any
  _syncedHandle: number
  _pubsub: any
  _nodeInfo: any
  _pubSubHandlerInstance: any

  constructor(id: string, postProcessors?: PostProcessor[]) {
    this.id = id
    this.postProcessors = postProcessors || _.values(basePostProcessors)
  }
  // Must be called before the thread can be used. Needed in addition to
  // Constructor because constructors must be syncronous. Consider a pattern
  // with a psuedo-constructor that returns a Promise<Thread> as the only
  // public construction method.
  async _initLog(db: any) {
    let log = this._log = await db.eventlog(this.id, {write: ['*']})
    this.address = log.address.toString()
    log.events.on('replicated', this.onEntryHandler.bind(this, 'remote'))
    log.events.on('write', this.onEntryHandler.bind(this, 'self'))
    // log.events.on('replicate.progress', this.progressHandler.bind(this))
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
  post(msg: string, profile?: Profile, file?: File, thumb?: string) {
    let post: UnPost = {
      kind: "Post",
      timestamp: Date.now(),
      text: msg,
      profile,
      attachment: undefined,
    }
    if (file) {
      post.attachment = {
        name: file.name,
        size: file.size,
        mime: file.type,
        content: "",
        thumbnail: thumb,
      }
      this._add(post)
    }
    else {
      this._add(post)
    }
  }
  _add(payload: Object) {
    const size = JSON.stringify(payload).length * 2 // approximation of byte size of string
    if (size <= MAX_UNPOST_SIZE_BYTES) {
      this._log.add(payload)
    } else {
      console.error("Refused to send a post of size " + size + "B")
    }
  }
  progressHandler(fromAddress: string, entryHash: string, entry: any, progress: any, haveMap: any) {
    console.log("PROGRESS", fromAddress, entryHash, entry, progress, haveMap)
  }
  onEntryHandler(source: 'remote' | 'self') {
    let entries: any[]
    entries = this._log.iterator({limit: -1}).collect()
    // If the first known entry has no 'next' hashes, we've fetched the whole history
    if (entries[0].next.length === 0) {
      this.backlogReplicated = true
    }
    console.log("ENTRIES UPDATED", entries)
    const temp = []
    for (let entry of entries) {
      if (entry.payload.value.kind === 'Post') {
        // This post has already been processed
        if (this._postById[entry.payload.value.id]) {
          temp.push(this._postById[entry.payload.value.id])
        }
        // This is a novel post, and needs to be processed
        else {
          // Note that size is calculated before processing the post. The restriction is for transit size
          const size = JSON.stringify(entry.payload.value).length * 2 // rough strlen to bytes conversion
          if (size <= MAX_POST_SIZE_BYTES) {
            const post = this.entryToPost(entry)
            this._postById[post.id] = post
            
            // Add notes from other posts that came out of order
            if (this._backNotes[post.id]) {
              post.notes.push(...this._backNotes[post.id])
            }
  
            const self = this
            post.notes.filter(x => x.group && x.group === 'references').forEach(x => {
              const note = {
                id: 'referenced-by-' + post.id + "-" + Math.random(),
                type: <'INFO'>'INFO', // Why Typescript, why?
                group: 'referenced-by',
                message: post.id,
              }
              // The referenced post has been seen, so add the referenced-by note to it
              if (self._postById[x.message]) {
                self._postById[x.message].notes.push(note)
              }
              // If the reference hasn't been seen, add the note to it's back notes, so we can add it when it's seen
              else {
                if (!self._backNotes[x.message]) self._backNotes[x.message] = []
                self._backNotes[x.message].push(note)
              }
            })
  
            temp.push(post)
          } else {
            console.log("Refusing to parse and display recieved post of size " + size + "B", entry)
          }
        }
      }
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
    if (entry.id === myId) post.profile.nickName += " (You)" // TODO: make not a hack
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
