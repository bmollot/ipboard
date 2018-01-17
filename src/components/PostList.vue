<template>
  <div class="post-list">
    <hr>
    <post-container
      v-for="post in posts"
      :key="post.id"
      :post="post"
    ></post-container>
    <hr>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import PostContainer from 'comp/PostContainer.vue'

import {Post} from 'types/post'

@Component({
  props: ['posts'],
  components: {
    'post-container': PostContainer
  }
})
export default class PostList extends Vue {
  posts: Array<Post>

  isScrolledToBottom: boolean = false

  scrollToBottom() {
    this.$el.scrollTop = this.$el.scrollHeight
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
      if (that.isScrolledToBottom) that.scrollToBottom()
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

