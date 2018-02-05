import {Profile} from 'types/profile'

/**
 * Represents a Post that hasn't yet been sent
 */
interface UnPost {
  kind: "Post"
  timestamp: number
  text: string
  profile?: Profile
}
/**
 * Represents a Post that *has* been sent, and therefor has a hash/id
 */
interface Post extends UnPost {
  kind: "Post"
  id: string
  fromId: string
  profile: Profile
  notes: Array<Note>
}

type NoteType = "INFO" | "WARNING" | "ERROR"
interface Note {
  id: string
  type: NoteType
  group?: string
  message?: string
}

export {UnPost, Post}
