<template>
  <div class="thread-view">
    {{ thread.address }}
    <post-list :posts="posts"></post-list>
    <thread-footer @new-post="post"></thread-footer>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import PostList from 'comp/PostList.vue'
import ThreadFooter from 'comp/ThreadFooter.vue'

import Thread from 'types/thread'

@Component({
  props: ['thread'],
  components: {
    'post-list': PostList,
    'thread-footer': ThreadFooter,
  }
})
export default class ThreadView extends Vue {
  thread: Thread

  get posts() {
    return this.thread.posts
  }

  post(msg: string) {
    this.thread.post(msg)
  }

  created() {
    (<any> window).bus.$on('new-post', this.post)
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

