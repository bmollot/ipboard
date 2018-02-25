import Storable from 'types/storable'
import { Profile } from 'types/profile'

import store from 'ts/store'

export default class UserConfig implements Storable {
  constructor(userName?: string) {
    this.userName = userName || "default"
    this.petNames[store.state.ipfsInfo.id] = "You"
  }

  path() {
    return `user/${this.userName}/config`
  }
  defaults() {
    return undefined
  }

  profile(): Profile | undefined {
    if (this.nickName && this.nickName !== '') {
      return {
        nickName: this.nickName
      }
    }
    return undefined
  }

  userName: string
  nickName: string = ""
  petNames: {
    [id: string]: string
  } = {}
  blockedNodes: string[] = []
  horizontalPosts: boolean = false
  // not implemented
  relativeTimestamps?: boolean
  showTumbnails?: boolean
  animatedThumbnails?: boolean
  imageHoverExpansion?: boolean
  videoHoverExpansion?: boolean // includes animated gifs/pngs
  notifyOnPost?: boolean
  notifyOnReply?: boolean
  recursivePostHiding?: boolean
  theme?: any
}
