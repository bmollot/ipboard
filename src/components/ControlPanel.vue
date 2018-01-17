<template>
  <div class="control-panel">
      <input v-model="threadId" placeholder="Thread ID to join">
      <button @click="joinThread(threadId)">JOIN</button>
      <button @click="toggleTest">{{testButMsg}}</button>
      <br>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import Thread from 'types/thread'

@Component({
  props: ['thread']
})
export default class ControlPanel extends Vue {
  thread: Thread

  threadId: string | null = null
  isTesting: boolean = false
  testId: number | null = null

  get testButMsg(): string {
    return this.isTesting ? "STOP TEST" : "START TEST"
  }

  joinThread(newId: string) {
    console.log("Joining", newId)
    this.$emit('changed-thread', newId)
  }

  toggleTest() {
    if (!this.isTesting) {
      this.isTesting = true
      this.testId = window.setInterval(() => {
        (<any> window).bus.$emit('new-post', "test post text " + new Date().toISOString())
      }, 1000);
    } else {
      this.isTesting = false
      if (this.testId !== null) {
        window.clearInterval(this.testId)
      }
    }
  }
}
</script>

<style>
</style>

