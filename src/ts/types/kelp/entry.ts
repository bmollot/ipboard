import {Multihash, EncodedMultihash} from '../multihash-shim'
const MH: Multihash = require('multihashes')
// const varint = require('varint')

type EntryType = 'Root' | 'Append'
function entryTypeToByte(type: EntryType): number {
  switch(type) {
    case 'Root': return 0
    case 'Append': return 1
  }
}
interface RootEntry {
  type: 0
  clock: 0
  payload: Buffer
}
interface AppendEntry {
  type: 1
  clock: number
  heads: EncodedMultihash[]
  payload: Buffer
}
interface MetaEntry {
  type: 2 | 3 // 2 indicates a recorded entry, 3 is transient
  clock: number
  left: number
  heads: EncodedMultihash[]
}
type Entry = RootEntry | AppendEntry | MetaEntry
type HashedEntry = Entry & {hash: EncodedMultihash}
function encodeEntry(entry: Entry): Buffer {
  if (entry.type === 0) {
    /*
     * Root Packet Format
     * ------------------
     * Name        Type          Bytes
     * ----------- ------------- -----------
     * type        uint          1
     * clock       uint          6
     * payloadSize uint          6
     * payload     arbitrary     payloadSize
     */
    const payloadSize = entry.payload.length
    const buf = Buffer.alloc(1 + 6 + 6 + payloadSize)
    let offset = 0

    buf[offset] = entry.type
    offset += 1
    offset = buf.writeUIntBE(entry.clock, offset, 6)
    offset = buf.writeUIntBE(payloadSize, offset, 6)
    offset += entry.payload.copy(buf, offset)

    console.log("ENCODED:", entry, buf)
    return buf
  }
  if (entry.type === 1) {
    /*
     * Append Packet Format
     * --------------------
     * Name        Type          Bytes
     * ----------  ------------- -----
     * type        uint          1
     * clock       uint          6
     * headsSize   uint          6
     * heads       Array<hash>   headsSize
     * payloadSize uint          6
     * payload     arbitrary     payloadSize
     */
    const headsSize = entry.heads.reduce((a,x) => a + x.length, 0)
    const payloadSize = entry.payload.length
    const buf = Buffer.alloc(1 + 6 + 6 + headsSize + 6 + payloadSize)
    let offset = 0

    buf[offset] = entry.type
    offset += 1
    offset = buf.writeUIntBE(entry.clock, offset, 6)
    offset = buf.writeUIntBE(headsSize, offset, 6)
    for (const head of entry.heads) {
      offset += head.copy(buf, offset)
    }
    offset = buf.writeUIntBE(payloadSize, offset, 6)
    offset += entry.payload.copy(buf, offset)

    return buf
  }
  if (entry.type === 2 || entry.type === 3) {
    /*
     * Meta Packet Format
     * --------------------
     * Name        Type          Bytes
     * ----------  ------------- -----
     * type        uint          1
     * clock       uint          6
     * left        uint          6
     * headsSize   uint          6
     * heads       Array<hash>   headsSize
     */
    const headsSize = entry.heads.reduce((a,x) => a + x.length, 0)
    const buf = Buffer.alloc(1 + 6 + 6 + 6 + headsSize)
    let offset = 0

    buf[offset] = entry.type
    offset += 1
    offset = buf.writeUIntBE(entry.clock, offset, 6)
    offset = buf.writeUIntBE(entry.left, offset, 6)
    offset = buf.writeUIntBE(headsSize, offset, 6)
    for (const head of entry.heads) {
      offset += head.copy(buf, offset)
    }

    return buf
  }
  throw new RangeError(`ENCODE: Invalid Entry.type (${entry})`)
}
function encodeHashedEntry(entry: HashedEntry) {
  return Buffer.concat([entry.hash, encodeEntry(entry)])
}

function decodeEntry(hash: EncodedMultihash, bufEntry: Buffer): HashedEntry {
  let offset = 0
  const type = bufEntry.readUInt8(0)
  offset += 1
  const clock = bufEntry.readUIntBE(offset, 6)
  offset += 6
  if (type === 0) {
    if (clock !== 0) {
      throw new RangeError(`DECODE: Invalid Entry.clock for RootEntry (${clock})`)
    }
    const payloadSize = bufEntry.readUIntBE(offset, 6)
    offset += 6
    const payload = Buffer.alloc(payloadSize)
    bufEntry.copy(payload, 0, offset)
    return {
      type: <0>0,
      clock: <0>0,
      hash,
      payload,
    }
  }
  if (type === 1) {
    if (clock < 1) {
      throw new RangeError(`DECODE: Invalid Entry.clock for AppendEntry (${clock})`)
    }
    const headsSize = bufEntry.readUIntBE(offset, 6)
    offset += 6
    const heads: EncodedMultihash[] = []
    let read = 0
    let buf: Buffer = bufEntry.slice(offset)
    while (read < headsSize) {
      const width = 34
      const head = Buffer.alloc(width)
      buf.copy(head, 0, 0, width)
      heads.push(head)
      buf = buf.slice(width)
      read += width
    }
    offset += read
    const payloadSize = bufEntry.readUIntBE(offset, 6)
    offset += 6
    const payload = Buffer.alloc(payloadSize)
    bufEntry.copy(payload, 0, offset)
    return {
      type,
      clock,
      hash,
      heads,
      payload,
    }
  }
  if (type === 2 || type === 3) {
    if (clock < 1) {
      throw new RangeError(`DECODE: Invalid Entry.clock for MetaEntry (${clock})`)
    }
    const left = bufEntry.readUIntBE(offset, 6)
    offset += 6
    const headsSize = bufEntry.readUIntBE(offset, 6)
    offset += 6
    const heads: EncodedMultihash[] = []
    let read = 0
    let buf: Buffer = bufEntry.slice(offset)
    while (read < headsSize) {
      const width = 34
      const head = Buffer.alloc(width)
      buf.copy(head, 0, 0, width)
      heads.push(head)
      buf = buf.slice(width)
      read += width
    }
    offset += read
    return {
      type,
      clock,
      left,
      hash,
      heads,
    }
  }
  throw new RangeError(`DECODE: Invalid Entry.type (${type})`)
}
function decodeHashedEntry(buf: Buffer): HashedEntry {
  const width = 34
  const hash = Buffer.alloc(width)
  buf.copy(hash, 0, 0, width)
  const bufEntry = buf.slice(width)
  return decodeEntry(hash, bufEntry)
}

export {
  Entry,
  HashedEntry,
  RootEntry,
  AppendEntry,
  MetaEntry,
  encodeEntry,
  encodeHashedEntry,
  decodeEntry,
  decodeHashedEntry,
}
