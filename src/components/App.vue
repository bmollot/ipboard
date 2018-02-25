<template>
  <div class="app">
    <control-panel v-if="usersReady"></control-panel>
    <thread-view v-if="dbReady"></thread-view>
    <loading v-else></loading>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import {mapState} from 'vuex'

import PostContainer from 'comp/PostContainer.vue'

import ControlPanel from 'comp/ControlPanel.vue'
import ThreadView from 'comp/ThreadView.vue'
import Loading from 'comp/Loading.vue'

import Thread from 'types/thread'

@Component({
  components: {
    'control-panel': ControlPanel,
    'thread-view': ThreadView,
    'loading': Loading,
  }
})
export default class App extends Vue {

  get db() {
    return this.$store.state.ipfsNode
  }
  get dbReady() {
    return this.$store.getters.isDBReady
  }
  get usersReady() {
    return this.$store.getters.areUsersReady
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

