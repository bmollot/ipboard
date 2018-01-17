<template>
  <div class="app">
      <control-panel :thread="currentThread" @changed-thread="updateViewedThread"></control-panel>
      <thread-view :thread="currentThread"></thread-view>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import ControlPanel from 'comp/ControlPanel.vue'
import ThreadView from 'comp/ThreadView.vue'

import Thread from 'types/thread'

@Component({
  props: ['db'],
  components: {
    'control-panel': ControlPanel,
    'thread-view': ThreadView,
  }
})
export default class App extends Vue {
  db: any

  currentThread = new Thread('test-thread')

  created() {
    this.currentThread.init(this.db)
  }

  updateViewedThread(newThreadId: string) {
    this.currentThread.destroy()
    this.currentThread = new Thread(newThreadId)
    this.currentThread.init(this.db)
  }
}
</script>

<style lang="sass">
.app
  height: 100vh
  display: flex
  flex-direction: column
  overflow: hidden
</style>

