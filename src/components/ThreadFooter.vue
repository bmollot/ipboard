<template>
  <div class="thread-footer">
    <input v-model="textToPost">
    <button @click="postClicked">POST</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

@Component
export default class ThreadFooter extends Vue {
  textToPost: string = ""
  
  postClicked() {
    this.$emit('new-post', this.textToPost)
    this.textToPost = ""
  }
}
</script>

<style>
</style>

