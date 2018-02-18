<template>
  <div class="thread-panel">
      <div class="left-controls">
        <input v-model="threadIdToJoin" placeholder="Thread ID to join">
        <button @click="joinThread(threadIdToJoin, last100 ? 100 : postsToShow)">JOIN</button>
        <input type="checkbox" v-model="last100" name="last100">
        <label for="last100">Last 100</label>
        <button @click="toggleTest">{{testButMsg}}</button>
        <div v-if="!thread.backlogReplicated && !thread.isEmpty" class="thread-replicating vertical-center">
          <div class="loading-spinner"></div>
          <span>Replicating thread history {{prettyProgress}}</span>
        </div>
        <div v-else-if="thread.isEmpty" class="vertical-center">
          <span>Thread seems to be empty. Be the first poster.</span>
        </div>
      </div>
      <div class="right-controls">
        <div style="display: inline-block" class="vertical-center" :title="threadAddress">
          Current thread: {{ threadId }}
        </div>
        <button @click="copyAddress" title="Copy full address to clipboard">📋</button>
        <div style="display: inline-block" class="vertical-center">
          Synced: [{{thread.synced.length}}]
        </div>
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
  last100: boolean = false
  postsToShow: number = Infinity
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
  get prettyProgress(): string {
    const p = this.thread.replicationProgress
    return `${p.done || '?'}/${p.target || '?'}`
  }

  joinThread(newId: string | null, postsToShow: number) {
    if (newId === null || newId === '') {
      console.error("Cannot join a thread with null or empty id, ignoring")
    }
    else {
      console.log("Joining", newId)
      this.$emit('changed-thread', newId, postsToShow)
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

<style lang="scss">
.thread-panel {
  display: flex;
  justify-content: space-between;
  background-color: #333333;
  color: #DDDDDD;
}
.left-controls {
  display: flex;
  flex-grow: 1;
}
.left-controls * {
  margin-left: 0.1em;
}
.right-controls {
  display: flex;
  justify-content: flex-end;
  flex-grow: 1;
}
.right-controls * {
  margin-right: 0.1em;
}
.thread-replicating {
  display: inline-block;
}
.loading-spinner {
  display: inline-block;
  border: 2px solid rgb(255, 255, 255);
  border-top: 2px solid rgb(64, 239, 252);
  border-radius: 50%;
  width: 0.7em;
  height: 0.7em;
  animation: spin 2s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

