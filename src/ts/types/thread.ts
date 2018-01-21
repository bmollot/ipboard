import MWC from 'utils/mwc'
import hashCode from 'utils/hashCode'
import escapeHtml from 'utils/escapeHtml'
import {PostProcessor} from 'types/postProcessor'
import PPE from 'types/postProcessorEnvironment'
import {UnPost, Post} from 'types/post'
import * as basePostProcessors from 'ts/basePostProcessors'

import * as _ from 'lodash'

export default class Thread {
  posts: Array<Post>
  address: string
  postProcessors: Array<PostProcessor>
  log: any

  constructor(public id: string, postProcessors?: Array<PostProcessor>) {
    this.posts = []
    this.address = ""
    this.postProcessors = postProcessors || _.values(basePostProcessors)
  }
  async init(db: any) {
    let log = this.log = await db.eventlog(this.id, {write: ['*']})
    this.address = log.address.toString()
    log.events.on('replicated', this.onEntryHandler.bind(this))
    log.events.on('write', this.onEntryHandler.bind(this))
    return await log.load() // This just boosts perf when complete, no need to wait
  }
  post(msg: string) {
    let post: UnPost = {
      timestamp: Date.now(),
      text: msg,
    }
    return this.log.add(post)
  }
  onEntryHandler() {
    let entries = this.log.iterator({limit: -1}).collect() // TODO Use a gt to prevent recollecting already parsed posts
    console.log("REPLICATED", entries)
    this.posts = entries.map(this.entryToPost.bind(this))
  }
  async destroy() {
    await this.log.drop()
    await this.log.close()
  }
  entryToPost(entry: any): Post {
    let v = entry.payload.value
    let post: Post = v
    post.id = entry.hash
    return this.processPost(post)
  }
  processPost(post: Post): Post {
    let seed = hashCode(post.id)
    let rng = new MWC(seed)
    let env = new PPE(rng, {
      processors: this.postProcessors
    })
    this.postProcessors.reduce((p, pp, i) => {
      env.kv['index'] = i
      return pp(p, env)
    }, post)
    return post
  }
}
