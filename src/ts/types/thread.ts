import MWC from 'utils/mwc'
import hashCode from 'utils/hashCode'
import escapeHtml from 'utils/escapeHtml'

import {PostProcessor} from 'types/postProcessor'
import PPE from 'types/postProcessorEnvironment'
import {UnPost, Post, Note, PostAttachment} from 'types/post'
import Kelp from 'types/kelp'

import * as basePostProcessors from 'ts/basePostProcessors'

import * as _ from 'lodash'
import {Multihash} from 'types/multihash-shim'
const MH: Multihash = require('multihashes')

import { defaultProfile, Profile } from 'types/profile'
import {
  MAX_UNPOST_SIZE_BYTES,
  MAX_POST_SIZE_BYTES,
  ALLOWED_THREAD_DIRTINESS,
  THREAD_CONNECTION_TIMEOUT
} from 'ts/constants'
import { HashedEntry, RootEntry, AppendEntry, MetaEntry } from 'types/kelp/entry';

interface String_Post {
  [id: string]: Post | undefined
}
interface String_Notes {
  [id: string]: Note[] | undefined
}

export default class Thread {
  id: string
  posts: Post[] = []
  synced: string[] = []
  address: string = ""
  backlogReplicated: boolean = false
  replicationProgress: {done: number | null, target: number | null} = {
    done: 0,
    target: Infinity,
  }
  postProcessors: PostProcessor[]
  initTime = 0
  isEmpty = false
  _postsToShow: number = Infinity
  _clocks: {[id: string]: number | undefined} = {}
  _backNotes: String_Notes = {}
  _postById: String_Post = {}
  _haveNeededPosts: boolean = false
  _timeUntilDesynced = 10000 // milliseconds
  _log?: Kelp
  _syncedHandle: number | undefined
  _pubsub: any
  _nodeInfo: any
  _latestEntryId?: string
  _latestPostTimestamp: number = 0
  _lastUpdateTimestamp: number = 0
  _queuedUpdateHandle: number | null = null

  constructor(id: string, postsToShow: number, postProcessors?: PostProcessor[]) {
    this.id = id
    this.postsToShow = postsToShow
    this.postProcessors = postProcessors || _.values(basePostProcessors)
  }
  // Must be called before the thread can be used. Needed in addition to
  // Constructor because constructors must be syncronous. Consider a pattern
  // with a psuedo-constructor that returns a Promise<Thread> as the only
  // public construction method.
  async _initLog(db: Kelp) {
    this.address = db.address.toString()
    db.onupdate = this.onEntryHandler.bind(this, 'remote')
    this.initTime = Date.now()
  }
  async _initOther(db: Kelp) {
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
    window.setTimeout(() => {
      self.isEmpty = self.posts.length === 0 && (self.replicationProgress.done === null)
    }, THREAD_CONNECTION_TIMEOUT)
  }
  /**
   * Must be called before the thread can be used. Needed in addition to
   * constructor because constructors must be syncronous. Consider a pattern
   * with a psuedo-constructor that returns a Promise<Thread> as the only
   * public construction method.
   * 
   * @param db A Kelp instance
   * @returns Promise<Promise<void>>. Intentionally tiered promise.
   *          The outer promise resolves when the Thread is ready for use.
   *          The inner promise resolves when the Thread is performant.
   *          The inner promise is almost meaningless atm, feel free to only await
   *          the outer one.
   */
  async init(node: any) {
    // Synchonous
    const db = new Kelp(node, this.id)
    await db.init()
    this._log = db
    this._pubsub = db._ipfs.pubsub
    // Parallel async inits (so performance)
    await Promise.all([
      this._initLog.bind(this, db)(),
      this._initOther.bind(this, db)(),
    ])
  }
  post(text: string, profile?: Profile, attachment?: PostAttachment) {
    let post: UnPost = {
      kind: "Post",
      timestamp: Date.now(),
      fromId: this._nodeInfo.id,
      text,
      profile,
      attachment,
    }
    this._add(post)
  }
  _add(payload: Buffer | Object) {
    // Ignore if init() has not been called successfully
    if (!this._log) return
    const buf = Buffer.isBuffer(payload) ? payload : Buffer.from(JSON.stringify(payload))
    if (buf.length <= MAX_UNPOST_SIZE_BYTES) {
      this._log.append(buf)
    } else {
      console.error("Refused to send a post of size " + buf.length + "B")
    }
  }
  get postsToShow() {
    return this._postsToShow
  }
  set postsToShow(x: number) {
    this._postsToShow = x
    this.updateProgress()
  }
  updateProgress(entry?: any, progress?: number) {
    if (progress) this.replicationProgress.done = progress
    // If we want the entire backlog, estimate how many posts that is
    if (entry && this.postsToShow === Infinity) {
      this._clocks[entry.clock.id] = Math.max(this._clocks[entry.clock.id] || 0, entry.clock.time)
      this.replicationProgress.target = _.values(this._clocks).reduce((x,y) => (x || 0) + (y || 0)) || null
    }
    // Otherwise it's just the configured number of posts
    else {
      this.replicationProgress.target = this.postsToShow
    }
  }
  onEntryHandler(source: 'remote' | 'self') {
    if (!this._log) return

    this.isEmpty = false
    let entries: HashedEntry[]
    
    // Once replication has finished, ensure that only new entries are processed
    // debounce updates to max once every tenth of a second
    if (Date.now() - this._lastUpdateTimestamp >= 100) {
      this.updatePosts(this._log.entries, true)
    }
    // And queue up a final update call
    else if (this._queuedUpdateHandle === null) {
      const self = this
      this._queuedUpdateHandle = window.setTimeout(() => {
        if (self._log) self.updatePosts(self._log.entries, true)
        self._queuedUpdateHandle = null
      }, 100)
    }
  }
  updatePosts(entries: HashedEntry[], purge = false) {
    this._lastUpdateTimestamp = Date.now()
    const temp: Post[] = []
    console.log("ENTRIES UPDATED", entries)
    for (let entry of entries) {

      // This post has already been processed
      const strHash = MH.toB58String(entry.hash)
      let post: Post | null = <Post>this._postById[strHash] || null
      if (post !== null) {
        // Add notes from other posts that came out of order
        const notes = this._backNotes[post.id]
        if (notes !== undefined) {
          post.notes.push(...notes)
          this._backNotes[post.id] = []
        }
      }

      // This is a novel entry, and needs to be processed
      else {
        if (entry.type === 0) {
          this.backlogReplicated = true
        }
        if (entry.type !== 1) continue
        if (entry.payload.length <= MAX_POST_SIZE_BYTES) {
          post = this.entryToPost(entry)
          // Skip entries that can't be interpreted as Posts
          if (post === null) {
            continue
          }
          this._postById[post.id] = post
          
          // Add notes from other posts that came out of order
          const notes = this._backNotes[post.id]
          if (notes !== undefined) {
            post.notes.push(...notes)
            this._backNotes[post.id] = []
          }

          for (const x of post.notes.filter(x => x.group && x.group === 'references')) {
            const note = {
              id: 'referenced-by-' + post.id + "-" + Math.random(),
              type: <'INFO'>'INFO', // Why Typescript, why?
              group: 'referenced-by',
              message: post.id,
            }
            // The referenced post has been seen, so add the referenced-by note to it
            const referencedPost = this._postById[x.message]
            if (referencedPost) {
              referencedPost.notes.push(note)
            }
            // If the reference hasn't been seen, add the note to it's back notes, so we can add it when it's seen
            else {
              if (!this._backNotes[x.message]) this._backNotes[x.message] = []
              const notes = this._backNotes[x.message]
              if (notes) notes.push(note)
            }
          }
          if (!purge) {
            this.posts.push(post)
          }
        } else {
          console.log("Refusing to parse and display recieved post of size " + entry.payload.length + "B", entry)
        }
      }
      if (purge) {
        temp.push(post)
      }
    }
    if (purge) {
      this.posts = temp
    }
    // Limit posts to latest N, where N = postsToShow
    const start = this.posts.length - this.postsToShow
    if (start > 0) {
      this.posts = this.posts.slice(start)
    }
    this.pruneUnusedPosts()
    // Update progress
    this.replicationProgress.done = this.posts.length
    this.replicationProgress.target = this.postsToShow
    if (this.replicationProgress.done >= this.replicationProgress.target) {
      this.backlogReplicated = true
    }
  }
  async pruneUnusedPosts() {
    const self = this
    return new Promise(resolve => {
      const unusedIds: Set<string> = new Set(Object.keys(self._postById))
      self.posts.forEach(post => {
        unusedIds.delete(post.id)
      })
      // Purge posts that aren't being displayed
      unusedIds.forEach(id => {
        delete self._postById[id]
      })
    })
    
  }
  async destroy() {
    if (this._syncedHandle) window.clearTimeout(this._syncedHandle)
    if (this._log) await this._log.destroy()
  }
  entryToPost(entry: HashedEntry): Post | null {
    if (entry.type === 2 || entry.type === 3) {
      return null
    }
    let v: UnPost = JSON.parse((<RootEntry | AppendEntry>entry).payload.toString())

    // Do some basic validation to ensure that this is actually an UnPost
    if (v.fromId === undefined || v.kind === undefined || v.text === undefined || v.timestamp === undefined) {
      return null
    }

    let post: Post = Object.assign({}, v, {
      id: MH.toB58String(entry.hash),
      profile: Object.assign({}, defaultProfile, v.profile),
      notes: [],
      memberOf: [this],
    })
    return this.processPost(post)
  }
  processPost(post: Post): Post {
    let seed = hashCode(post.id)
    let rng = new MWC(seed)
    let env = new PPE(rng, {
      self: this,
      nodeId: this._nodeInfo.id,
    })
    this.postProcessors.reduce((p, pp, i) => {
      env.kv['index'] = i
      return pp(p, env)
    }, post)
    return post
  }
}
