<template>
  <div class="post-list">
    <post-container
      v-for="post in limitedPosts"
      :key="post.id"
      :post="post"
      :threadAddress="threadAddress"
      @replyTo="replyTo"
    ></post-container>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import PostContainer from 'comp/PostContainer.vue'

import {Post} from 'types/post'

interface PostIdToLinks {
  [postId: string]: Set<string>
}

@Component({
  props: ['posts', 'limit', 'threadAddress'],
  components: {
    'post-container': PostContainer
  }
})
export default class PostList extends Vue {
  posts: Array<Post>
  limit: number
  threadAddress: string
  linksTo: PostIdToLinks

  isScrolledToBottom: boolean = false

  scrollToBottom() {
    this.$el.scrollTop = this.$el.scrollHeight
  }
  scrollIfLocked() {
    if (this.isScrolledToBottom) this.scrollToBottom()
  }

  replyTo(postId: string) {
    this.$emit('replyTo', postId)
  }

  get limitedPosts() {
    const start = this.posts.length - this.limit
    if (start > 0) {
      return this.posts.slice(start)
    }
    else {
      return this.posts
    }
  }

  mounted() {
    let that = this
    this.$el.addEventListener('scroll', ev => {
      let el = (<Element> ev.target)
      that.isScrolledToBottom = el.scrollHeight - el.scrollTop === el.clientHeight
    })
  }
  updated() {
    let that = this
    this.$nextTick(() => {
      that.scrollIfLocked()
    })
  }
}
</script>

<style lang="sass">
.post-list
  flex-basis: 0
  flex-grow: 1
  overflow: auto
</style>

