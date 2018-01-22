<template>
  <div class="thread-view">
    <thread-control
      :thread="thread"
      @new-post="post"
      @changed-thread="updateViewedThread"
    ></thread-control>
    <post-list :posts="posts"></post-list>
    <thread-footer @new-post="post"></thread-footer>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import ThreadControl from 'comp/ThreadControl.vue'
import PostList from 'comp/PostList.vue'
import ThreadFooter from 'comp/ThreadFooter.vue'

import Thread from 'types/thread'

@Component({
  components: {
    'thread-control': ThreadControl,
    'post-list': PostList,
    'thread-footer': ThreadFooter,
  }
})
export default class ThreadView extends Vue {
  thread: Thread = new Thread('welcome')
  created() {
    this.thread.init(this.db)
  }

  get db() {
    return this.$store.state.database
  }
  get posts() {
    return this.thread.posts
  }

  post(msg: string) {
    this.thread.post(msg)
  }
  updateViewedThread(newThreadId: string) {
    this.thread.destroy()
    this.thread = new Thread(newThreadId)
    this.thread.init(this.db)
  }
}
</script>

<style lang="sass">
.thread-view
  flex-basis: 0
  flex-grow: 1
  overflow: hidden

  display: flex
  flex-direction: column
</style>

