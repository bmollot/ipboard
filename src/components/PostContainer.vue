<template>
  <div class="post-container">
    <div class="post-id">{{ prettyId }}</div>
    <div class="post-timestamp">{{ prettyTime }}</div>
    <div class="post-text-content" v-html="post.text"></div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import {Post} from 'types/post'

@Component({
  props: ['post']
})
export default class PostContainer extends Vue {
  post: Post

  get prettyId(): string {
    return this.post.id
  }
  get prettyTime(): string {
    return new Date(this.post.timestamp).toLocaleString() // TODO make formatting configurable
  }
}
</script>

<style lang="sass">
.post-container
  background: grey
</style>

