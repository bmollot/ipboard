<template>
  <div class="post-list" ref="list">
    <post-container
      v-for="post in limitedPosts"
      :key="post.id"
      :post="post"
      :threadAddress="threadAddress"
      @replyTo="replyTo"
    ></post-container>
    <div v-if="isScrolledToBottom" class="post-list-anchored">Locked</div>
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
    const list = this.$refs.list
    if (list instanceof Element)
      list.scrollTop = list.scrollHeight
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
    const self = this
    const list = this.$refs.list
    if (list instanceof Element)
      list.addEventListener('scroll', ev => {
        let el = (<Element> ev.target)
        self.isScrolledToBottom = el.scrollHeight - el.scrollTop === el.clientHeight
      })
  }
  updated() {
    const self = this
    this.$nextTick(() => {
      self.scrollIfLocked()
    })
  }
}
</script>

<style lang="scss">
.post-list {
  flex-basis: 0;
  flex-grow: 1;
  overflow: auto;
}
.post-list-anchored {
  position: absolute;
  right: 0;
  bottom: 0;
}
</style>

