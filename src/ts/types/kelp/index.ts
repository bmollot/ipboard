import hashCode from 'utils/hashCode'
import {Multihash} from '../multihash-shim'
import {Log} from './log'
import {
  Entry,
  HashedEntry,
  RootEntry,
  AppendEntry,
  MetaEntry,
  encodeEntry,
  encodeHashedEntry,
  decodeEntry,
  decodeHashedEntry,
} from './entry'

const MH: Multihash = require('multihashes')
const vd: (buf: Buffer) => number[] = require('varint-decoder')

const MAGIC_STRING = 'mary had a little lamb'
const KELP_VERSION = '0.1'

// Represents an IPFS backed Log
class Kelp {
  _log: Log
  _ipfs: any
  _topic: string
  _pubsubHandlerInstance: any
  _clock: number
  _fetchingHashes: Set<string> = new Set<string>()
  _numHashesInMeta = 100
  _numEntriesSinceMeta = Infinity
  _metaIntervalHandle = 0
  _initialized = false
  onupdate?: (entry: HashedEntry) => void
  address: string
  behindBy = 0

  // Expects an initialized and working object that implements the IPFS Core API
  constructor(ipfs: any, topic: string) {
    topic = encodeURIComponent(topic)
    this._log = new Log()
    this._ipfs = ipfs
    this._topic = topic
    this._clock = 0
    let hash = ('0000000' + hashCode(MAGIC_STRING + KELP_VERSION + topic).toString(16)).slice(-8).toUpperCase()
    this.address = `/kelp/${hash}/${topic}`
  }
  async init() {
    if (this._initialized) {
      console.log("KELP: Refusing to initialize again", this.address)
      return
    }
    console.log("KELP: Initializing", this.address)
    this._pubsubHandlerInstance = this._pubsubHandler.bind(this)
    await this._ipfs.pubsub.subscribe(this.address, {discover: true}, this._pubsubHandlerInstance)
    this._metaIntervalHandle = window.setInterval(this._metaInterval.bind(this), 10000)
    this._initialized = true
  }
  // will not shut down IPFS node (or attempt to)
  async destroy() {
    console.log("KELP: Destroying", this.address)
    this.onupdate = undefined
    this._ipfs.pubsub.unsubscribe(this.address, this._pubsubHandlerInstance)
    window.clearInterval(this._metaIntervalHandle)
    this._initialized = false
  }

  get entries(): HashedEntry[] {
    return this._log.ordered
  }

  async _metaInterval() {
    console.log("KELP: Meta Interval")
    const peers: string[] = await this._ipfs.pubsub.peers(this.address)
    console.log("KELP: Peers", peers)
    if (Math.random() * peers.length < 1 && this._clock > 0) {
      const toPub: HashedEntry = {
        type: 3,
        clock: this._clock,
        left: Math.max(this.entries.length - this._numHashesInMeta, 0),
        heads: this.entries.slice(-this._numHashesInMeta).map(x => x.hash),
        hash: Buffer.alloc(34),
      }
      await this._ipfs.pubsub.publish(this.address, encodeHashedEntry(toPub))
      console.log("KELP: Pubbed transient Meta Entry", toPub)
    }
  }

  _pubsubHandler(msg: {from: string, seqno: Buffer, data: Buffer, topicIDs: Array<string>}) {
    console.log("KELP: Got pubsub", msg)
    const e = decodeHashedEntry(msg.data)
    // Type 3 indicates a transient meta entry, we only want to fetch the referenced posts, nothing else
    if (e.type === 3) {
      this._fetchHeads(e)
      return
    }
    // This should already exist on IPFS, but we put it so that we mirror it for speed and reliability
    this._ipfs.object.put(msg.data)
    this._handleEntry(e, 'append')
  }

  _fetchHeads(e: HashedEntry) {
    // Root Entries (type 0) have no heads
    if (e.type === 0) return
    if (e.type === 2) this.behindBy = e.left + 1 - this.entries.length
    // For all referenced heads
    for (const h of e.heads) {
      const hash = MH.toB58String(h)
      // If we don't already have the referenced entry
      if (!this._log._nodes[hash]) {
        // and we're not currently fetching the entry
        if (!this._fetchingHashes.has(hash)) {
          // Indicate that we're fetching that hash now
          this._fetchingHashes.add(hash)
          const self = this
          this._ipfs.object.get(h, (err: Error | undefined, node: any) => {
            if (err) {
              console.log("Failed to get a referenced Entry", err)
              return
            }
            console.log("Got ipfs object")
            const o = decodeEntry(h, node.data)
            self._fetchingHashes.delete(hash)

            self._handleEntry(o, 'prepend')
          })
        }
      }
    }
  }

  _handleEntry(e: HashedEntry, location: 'prepend' | 'append') {
    // Add to internal log
    if (location === 'prepend') {
      this._log.prepend(e)
      this.behindBy -= 1
    }
    if (location === 'append') {
      this._log.append(e)
    }
    // update clock
    this._clock = Math.max(this._clock, e.clock) + 1
    // update last known meta
    if (e.type === 2) {
      this._numEntriesSinceMeta = 0
    } else {
      this._numEntriesSinceMeta += 1
    }
    // Fetch referenced heads
    if (e.type !== 0) {
      this._fetchHeads(e)
    }
    if (this.onupdate) this.onupdate(e)
  }

  async makeRoot(payload: Buffer) {
    console.log("Making root")
    // Add entry to ipfs
    const toAdd: RootEntry = Object.assign({}, {
      type: <0>0,
      clock: <0>0,
      payload,
    })
    const dag = await this._ipfs.object.put(encodeEntry(toAdd))
    // Publish entry
    const toPub: HashedEntry = Object.assign(toAdd, {
      hash: dag.multihash
    })
    await this._ipfs.pubsub.publish(this.address, encodeHashedEntry(toPub))
  }

  async append(payload: Buffer) {
    // If no known root
    if (this._clock === 0) {
      // Make one, with no content for now
      // TODO: Spec out what should go in the root entry (if anything)
      await this.makeRoot(Buffer.from("{}"))
      // Wait until this root is seen and processed
      while (this._log.heads.length === 0) {
        await new Promise(resolve => window.setTimeout(resolve, 100))
      }
    }
    // Add entry to ipfs
    const toAdd: AppendEntry = Object.assign({}, {
      type: <1>1,
      clock: this._clock,
      payload,
      heads: this._log.heads.map(x => x.value.hash),
    })
    const dag = await this._ipfs.object.put(encodeEntry(toAdd))
    console.log("KELP: Done putting", dag)
    // Publish entry
    const toPub: HashedEntry = Object.assign(toAdd, {
      hash: dag.multihash
    })
    await this._ipfs.pubsub.publish(this.address, encodeHashedEntry(toPub))
    console.log("KELP: Done pubbing", toPub)
    this._maybeMakeMeta()
  }

  async _maybeMakeMeta(): Promise<boolean> {
    let making = false
    // then make a meta post only if a full one can be made
    if (this._numEntriesSinceMeta >= this._numHashesInMeta) {
      making = true
    }

    if (making) {
      const toAdd: MetaEntry = {
        type: <2>2,
        clock: this._clock,
        left: Math.max(this.entries.length - 100, 0),
        heads: this.entries.slice(-100).map(x => x.hash),
      }
      const dag = await this._ipfs.object.put(encodeEntry(toAdd))
      const toPub: HashedEntry = Object.assign(toAdd, {
        hash: dag.multihash
      })
      await this._ipfs.pubsub.publish(this.address, encodeHashedEntry(toPub))
      console.log("KELP: Made a MetaEntry", toPub)
    }
    console.log("KELP: Didn't make a MetaEntry")
    return making
  }
}


export default Kelp
