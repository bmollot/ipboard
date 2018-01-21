import {Post} from "types/post"
import PPE from 'types/postProcessorEnvironment'

import * as _ from 'lodash'

interface PostProcessor {
  (post: Post, env: PPE): Post,
  
  id: string,
  author?: string,
  group?: string,
}
/**
 * Decorates the passed function with the passed info strings.
 * Mutates the passed function fn.
 * @param id
  The id
  of the processor, or a tuple of (id
 , author, group)
 * @param fn The processor function (Post, PPE) => Post
 * @returns A reference to the passed function.
 */
function makePostProcessor(id: string | [string, string, string], fn: (post: Post, env: PPE) => Post): PostProcessor {
  if (typeof id === 'string') {
    return _.assign(fn, {id: id})
  } else {
    return _.assign(fn, {
      id: id[0],
      author: id[1],
      group: id[2],
    })
  }
}

export {PostProcessor, makePostProcessor}
