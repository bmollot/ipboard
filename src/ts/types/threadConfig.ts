import Storable from 'types/storable'

export default class ThreadConfig implements Storable {
  constructor(threadName?: string) {
    this.threadName = threadName || "welcome"
    this.hiddenPosts = []
  }

  path() {
    return `thread/${this.threadName}/config`
  }
  defaults() {
    return {
      relativeTimestamps: false,
      showTumbnails: true,
      animatedThumbnails: false,
      imageHoverExpansion: false,
      videoHoverExpansion: false, // includes animated gifs/pngs
      notifyOnPost: false,
      notifyOnReply: false,
      recursivePostHiding: true,
      horizontalPosts: false,
      theme: {},
    }
  }

  threadName: string
  hiddenPosts: string[]
  // not implemented
  relativeTimestamps: boolean = false
  showTumbnails: boolean = true
  animatedThumbnails: boolean = false
  imageHoverExpansion: boolean = false
  videoHoverExpansion: boolean = false // includes animated gifs/pngs
  notifyOnPost: boolean = false
  notifyOnReply: boolean = false
  recursivePostHiding: boolean = false
  horizontalPosts: boolean = false
  theme: any
}
