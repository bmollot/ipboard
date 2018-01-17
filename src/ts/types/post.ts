/**
 * Represents a Post that hasn't yet been sent
 */
interface UnPost {
  timestamp: number
  text: string
}
/**
 * Represents a Post that *has* been sent, and therefor has a hash/id
 */
interface Post extends UnPost {
  id: string
}

export {UnPost, Post}
