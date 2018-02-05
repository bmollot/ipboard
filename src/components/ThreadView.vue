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
        :threadAddress="thread.address"
        @replyTo="replyTo"
      ></post-list>
      <thread-footer @new-post="post" ref="footer"></thread-footer>
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

@Component({
  components: {
    'thread-control': ThreadControl,
    'post-list': PostList,
    'thread-footer': ThreadFooter,
  }
})
export default class ThreadView extends Vue {
  thread: Thread = new Thread('welcome')
  threadConfig: ThreadConfig
  ready: boolean = false

  created() {
    const self = this
    this.thread.init(this.$store.state.database).then(async () => {
      self.threadConfig = new ThreadConfig(self.thread.address)
      await self.$store.dispatch('addThreadConfig', self.threadConfig)
      self.ready = true
    })
  }

  get db() {
    return this.$store.state.database
  }
  get posts() {
    return this.thread.posts
  }

  get userConfig(): LocalStore<UserConfig> {
    return this.$store.getters.userConfigs[this.$store.state.currentUser]
  }

  post(msg: string) {
    this.thread.post(msg, this.userConfig.data.profile)
  }
  replyTo(postId: string) {
    let footer = <ThreadFooter>this.$refs.footer
    footer.replyTo(postId)
  }
  updateViewedThread(newThreadId: string) {
    this.thread.destroy()
    this.thread = new Thread(newThreadId)
    this.thread.init(this.db)
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

