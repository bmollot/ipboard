<template>
  <div class="thread-footer">
    <div class="compose-post-area" v-if="composing">
      <textarea ref="textarea" cols="60" rows="10" v-model="textToPost"></textarea>
      <button @click="postClicked">SUBMIT</button>
      <button @click="cancelCompose">CANCEL</button>
      <button @click="clearComposed">CLEAR</button>
    </div>
    <div v-else>
      <button @click="toComposeMode">POST</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import PostList from 'comp/PostList.vue'

@Component
export default class ThreadFooter extends Vue {
  composing: boolean = false
  textToPost: string = ""
  
  postClicked() {
    this.$emit('new-post', this.textToPost)
    this.textToPost = ""
    this.composing = false
  }
  toComposeMode() {
    this.composing = true
    // Force an update for PostList... for some reason
    this.$parent.$children.forEach(x => {
      if (x.$vnode.tag && x.$vnode.tag.includes('PostList')) {
        x.$forceUpdate()
      }
    })
    // Focuse the textarea next tick, as it's not rendered yet
    let that = this
    this.$nextTick().then(() => {
      let ta = that.$refs.textarea
      if (ta instanceof HTMLElement) {
        ta.focus()
      }
    })
  }
  cancelCompose() {
    this.composing = false
  }
  clearComposed() {
    this.textToPost = ""
  }

  replyTo(postId: string) {
    if (!this.composing) {
      this.toComposeMode()
      this.textToPost += `>>${postId}\n`
    }
    else {
      let ta = this.$refs.textarea
      if (ta instanceof HTMLElement) {
        ta.focus()
      }
      this.textToPost += `>>${postId} `
    }
  }
}
</script>

<style>
</style>

