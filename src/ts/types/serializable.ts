export default interface Serializable<T> {
  serialize(): Buffer
  deserialize(buf: Buffer): T
}
