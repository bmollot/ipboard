<template>
  <div class="expand">
    <div v-if="ready" class="thread-view">
      <thread-control
        :thread="thread"
        @new-post="post"
        @changed-thread="updateViewedThread"
      ></thread-control>
      <post-list
        :posts="posts"
        :limit="thread.postsToShow"
        :threadAddress="thread.address"
        @replyTo="replyTo"
      ></post-list>
      <thread-footer
        @new-post="post"
        @upload-file="uploadFile"
        :uploadStatus="uploadStatus"
        ref="footer"
      ></thread-footer>
    </div>
    <div v-else>
      <div class="centered">
        <span>Loading thread settings...</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import ThreadControl from 'comp/ThreadControl.vue'
import PostList from 'comp/PostList.vue'
import ThreadFooter from 'comp/ThreadFooter.vue'

import Thread from 'types/thread'
import ThreadConfig from 'types/threadConfig'
import LocalStore from 'types/localStore';
import UserConfig from 'types/userConfig';
import {PostAttachment} from 'types/post'

@Component({
  components: {
    'thread-control': ThreadControl,
    'post-list': PostList,
    'thread-footer': ThreadFooter,
  }
})
export default class ThreadView extends Vue {
  thread: Thread = new Thread('welcome', 100)
  threadConfig: ThreadConfig
  ready: boolean = false

  uploadStatus: {
    uploading: File | null
    done: boolean
    results: {
      path: string,
      hash: string,
      size: number // bytes
    } | null
  } = {
    uploading: null,
    done: false,
    results: null,
  }

  created() {
    this.updateViewedThread('welcome', 100, true)
  }

  mounted() {
    const self = this
    document.addEventListener("keypress", ev => {
      if (!(document.activeElement instanceof HTMLInputElement
            || document.activeElement instanceof HTMLTextAreaElement)) {
        if (ev.key === 'a') {
          const footer: ThreadFooter = <ThreadFooter> self.$refs.footer
          if (!footer.composing) {
            footer.toComposeMode()
            ev.preventDefault()
          }
        }
        if (ev.key === 'r') {
          const footer: ThreadFooter = <ThreadFooter> self.$refs.footer
          const posts = self.thread.posts
          if (!footer.composing) {
            if (posts.length > 0) {
              footer.replyTo(posts[posts.length - 1].id)
            }
            else {
              footer.toComposeMode()
            }
            ev.preventDefault()
          }
        }
        if (ev.key === 'u') {
          const footer: ThreadFooter = <ThreadFooter> self.$refs.footer
          footer.toComposeMode(() => {
            const filein = footer.$refs.filein
            if (filein instanceof HTMLInputElement) {
              filein.click()
            }
          })
          ev.preventDefault()
        }
      }
    })
  }

  get ipfsNode() {
    return this.$store.state.ipfsNode
  }
  get posts() {
    return this.thread.posts
  }

  get userConfig(): LocalStore<UserConfig> {
    return this.$store.getters.userConfigs[this.$store.state.currentUser]
  }

  post(msg: string, attachment?: PostAttachment) {
    console.log(this.userConfig)
    this.thread.post(msg, this.userConfig.data.profile(), attachment)
  }
  replyTo(postId: string) {
    if (this.$refs.footer instanceof ThreadFooter) {
      const footer: ThreadFooter = <ThreadFooter> this.$refs.footer
      footer.replyTo(postId)
    }
  }
  async updateViewedThread(newThreadId: string, postsToShow: number, dontReplace = false) {
    this.ready = false

    if (!dontReplace) {
      // Destroy current thread
      await this.thread.destroy()
      // Make and init a new one
      this.thread = new Thread(newThreadId, postsToShow)
    }
    
    await this.thread.init(this.ipfsNode)

    // Load in/create this new thread's config
    this.threadConfig = new ThreadConfig(this.thread.address)
    await this.$store.dispatch('addThreadConfig', this.threadConfig)
    
    this.ready = true
  }
  uploadFile(file: File) {
    this.uploadStatus = {
      uploading: file,
      done: false,
      results: null,
    }

    const self = this
    const fr = new FileReader()
    fr.readAsArrayBuffer(file)
    fr.onloadend = async () => {
      const ab: ArrayBuffer = fr.result
      const buf = Buffer.from(ab)
      console.log("Loaded file", ab, buf)
      const node = this.$store.state.ipfsNode
      const res = await node.files.add(buf)
      console.log("Added file", res)
      self.uploadStatus.results = res[0]
      self.uploadStatus.done = true
    }
  }
}
</script>

<style lang="scss">
.expand {
  height: 100%;
  width: 100%;

  flex-basis: 0;
  flex-grow: 1;
  overflow: hidden;

  display: flex;
  flex-direction: column;
}
.thread-view {
  flex-basis: 0;
  flex-grow: 1;
  overflow: hidden;

  display: flex;
  flex-direction: column;
}

.centered {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>

