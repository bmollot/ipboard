<template>
  <div class="post-list">
    <post-container
      v-for="post in posts"
      :key="post.id"
      :post="post"
      :threadAddress="threadAddress"
      :linkedFrom="links(post.id)"
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
  props: ['posts', 'threadAddress'],
  components: {
    'post-container': PostContainer
  }
})
export default class PostList extends Vue {
  posts: Array<Post>
  threadAddress: string

  isScrolledToBottom: boolean = false

  scrollToBottom() {
    this.$el.scrollTop = this.$el.scrollHeight
  }
  scrollIfLocked() {
    if (this.isScrolledToBottom) this.scrollToBottom()
  }

  get linksTo(): PostIdToLinks {
    let ret: PostIdToLinks = {}
    this.posts.forEach(post => {
      post.notes.forEach(note => {
        if (note.group && note.group === 'links-to') {
          if (note.message) {
            let toId = note.message
            ret[toId] = ret[toId] || new Set<string>()
            ret[toId].add(post.id)
          }
        }
      })
    })
    return ret
  }
  links(toId: string) {
    return this.linksTo[toId]
  }

  replyTo(postId: string) {
    this.$emit('replyTo', postId)
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

