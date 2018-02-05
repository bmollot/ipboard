import Storable from 'types/storable'
import { Profile } from 'types/profile';

export default class UserConfig implements Storable {
  constructor(userName?: string) {
    this.userName = userName || "default"
    if (userName && userName !== "default") this.profile = {
      nickName: userName
    }
    this.petNames = {} // nodeId => name
    this.blockedNodes = []
  }

  path() {
    return `user/${this.userName}/config`
  }
  static defaults() {
    return {}
  }

  userName: string
  profile?: Profile
  petNames: any // string => string
  blockedNodes: string[]
  // not implemented
  relativeTimestamps?: boolean
  showTumbnails?: boolean
  animatedThumbnails?: boolean
  imageHoverExpansion?: boolean
  videoHoverExpansion?: boolean // includes animated gifs/pngs
  notifyOnPost?: boolean
  notifyOnReply?: boolean
  recursivePostHiding?: boolean
  horizontalPosts?: boolean
  theme?: any
}
