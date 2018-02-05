export default interface Storable {
  path: () => string
  defaults?: () => any
}