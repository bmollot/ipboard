import {Multihash, EncodedMultihash} from '../multihash-shim'
const MH: Multihash = require('multihashes')
import {Entry, HashedEntry} from './entry'

class DAGNode<T> {
  next: DAGNode<T>
  value: T
  constructor(value: T, next?: DAGNode<T>) {
    this.value = value
    this.next = next ? next : this
  }
  get hasNext(): boolean {
    return this !== this.next
  }
}

interface DropReason {
  deniedBy: string
  reason: string[]
}
type DropRule = (entry: Entry) => DropReason | null

class Log {
  _nodes: {
    [base58multihash: string]: DAGNode<HashedEntry>
  } = {}
  _stubs:  DAGNode<HashedEntry>[] = []
  heads:  DAGNode<HashedEntry>[] = []
  ordered: HashedEntry[] = []
  dropRules: DropRule[] = []
  
  // Validate before calling
  // Called when populating from IPFS
  prepend(entry: HashedEntry): boolean {
    const hashStr = MH.toB58String(entry.hash)
    const hashBuf = entry.hash

    // If this hasn't been seen before
    if (!this._nodes[hashStr]) {
      // Wrap it in a stub DAGNode
      const dag = new DAGNode(entry)
      // Check if a stub wants it
      let addedTo = 0
      for (const stub of this._stubs) {
        // Skip root stubs
        if (stub.value.type === 0) continue
        // Check if parent (first entry in heads) matches new hash
        if (stub.value.heads[0].compare(hashBuf) === 0) {
          // And assign the stub its proper 'next' value (this entry)
          stub.next = dag
          addedTo++
          // which means it's no longer a stub, so remove it from that list
          this._stubs.splice(this._stubs.indexOf(stub), 1)
        }
      }
      // If not wanted by any stubs, it's a new head
      if (addedTo === 0) {
        this.heads.push(dag)
      }
      // In any case, this is a node and a stub, so store it
      this._nodes[hashStr] = dag
      this._stubs.push(dag)
      this._insertOrdered(entry)
      // Add was successful: return true
      return true
    }
    // This entry has been seen before, so wont be added: return false
    return false
  }
  // Called when adding an entry from pubsub
  append(entry: HashedEntry): boolean {
    const hashStr = MH.toB58String(entry.hash)
    const hashBuf = entry.hash

    // If this hasn't been seen before
    if (!this._nodes[hashStr]) {
      // Root Entry
      if (entry.type === 0) {
        // Wrap it in a stub DAGNode
        const dag = new DAGNode(entry)
        // An appended root never affects other nodes, so just add it
        this._nodes[hashStr] = dag
        this.heads.push(dag)
      }
      // Append Entry
      if (entry.type === 1) {
        // Wrap it in a DAGNode with appropriate 'next'
        const next = this._nodes[MH.toB58String(entry.heads[0])]
        const dag = new DAGNode(entry, next || undefined)
        if (next === undefined) {
          this._stubs.push(dag)
        } else {
          const i = this.heads.indexOf(next)
          // Parent node was a head
          if (i >= 0) {
            // Remove it from the list of heads
            this.heads.splice(i, 1)
            
          }
        }
        this._nodes[hashStr] = dag
        this.heads.push(dag)
      }
      this._insertOrdered(entry)
      // Add was successful: return true
      return true
    }
    // This entry has been seen before, so wont be added: return false
    return false
  }

  _insertOrdered(e: HashedEntry) {
    let added = false
    let o: HashedEntry
    for (let i = 0; i < this.ordered.length; i++) {
      o = this.ordered[i]
      // Order by clock
      if (e.clock < o.clock) {
        this.ordered.splice(i, 0, e)
        added = true
        break
      }
      // Fall back to ordering by hash to ensure consistent ordering
      if (e.clock === o.clock) {
        if (e.hash.compare(o.hash) < 0) {
          this.ordered.splice(i, 0, e)
          added = true
          break
        }
      }
    }
    if (!added) {
      this.ordered.push(e)
    }
  }

  validate(entry: Entry): DropReason[] {
    const reasons: DropReason[] = []
    let dr
    for (const rule of this.dropRules) {
      dr = rule(entry)
      if (dr) {
        reasons.push(dr)
      }
    }
    return reasons
  }
}

export {Log, DropRule, DropReason}