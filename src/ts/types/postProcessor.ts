import {Post} from "types/post"
import PPE from 'types/postProcessorEnvironment'

interface PostProcessor {
  (post: Post, env: PPE): Post,
  
  name: string,
  author?: string,
  group?: string,
} 

export default PostProcessor
