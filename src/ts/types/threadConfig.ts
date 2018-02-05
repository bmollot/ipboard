import Storable from 'types/storable'

export default class ThreadConfig implements Storable {
  constructor(threadName?: string) {
    this.threadName = threadName || "welcome"
    this.hiddenPosts = []
  }

  path() {
    return `thread/${this.threadName}/config`
  }
  static defaults() {
    return {
      relativeTimestamps: false,
      showTumbnails: true,
      animatedThumbnails: false,
      imageHoverExpansion: true,
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
  relativeTimestamps: boolean
  showTumbnails: boolean
  animatedThumbnails: boolean
  imageHoverExpansion: boolean
  videoHoverExpansion: boolean // includes animated gifs/pngs
  notifyOnPost: boolean
  notifyOnReply: boolean
  recursivePostHiding: boolean
  horizontalPosts: boolean
  theme: any
}
