<template>
  <div class="control-panel">
      <input v-model="threadIdToJoin" placeholder="Thread ID to join">
      <button @click="joinThread(threadIdToJoin)">JOIN</button>
      <button @click="toggleTest">{{testButMsg}}</button>
      <div style="float: right">
        <span :title="threadAddress">Current thread: {{ threadId }}</span>
        <button @click="copyAddress" title="Copy full address to clipboard">📋</button>
        <span>Synced: [{{thread.synced.length}}]</span>
      </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import Thread from 'types/thread'
import {copyTextToClipboard} from 'utils/clipboard'
import LocalStore from 'types/localStore'
import ThreadConfig from 'types/threadConfig'

@Component({
  props: ['thread']
})
export default class ThreadControl extends Vue {
  thread: Thread

  threadIdToJoin: string | null = null
  isTesting: boolean = false
  testId: number | null = null

  get testButMsg(): string {
    return this.isTesting ? "STOP TEST" : "START TEST"
  }
  get threadAddress(): string {
    return this.thread.address
  }
  get threadId(): string {
    const res = /\/orbitdb\/([0-z])*\/(.*)/.exec(this.threadAddress)
    if (res) {
      return res[2]
    } else {
      return "null"
    }
  }

  joinThread(newId: string | null) {
    if (newId === null || newId === '') {
      console.error("Cannot join a thread with null or empty id, ignoring")
    }
    else {
      console.log("Joining", newId)
      this.$emit('changed-thread', newId)
    }
  }
  copyAddress() {
    copyTextToClipboard(this.threadAddress)
  }
  toggleTest() {
    if (!this.isTesting) {
      this.isTesting = true
      this.testId = window.setInterval(() => {
        this.$emit('new-post', "test post text " + new Date().toISOString())
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

