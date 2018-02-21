// Import styles for bundling
import 'normalize.css'
import 'styles/base.scss'
import 'styles/basePostProcessors.scss'
import 'styles/tomorrow.scss'

/* 
 * Import .vue files here, even though they aren't used, or else HardSourceWebpackPlugin breaks.
 * This seems to be a specific issue with importing .vue files from a <script lang="ts"> block in
 * another .vue file. ¯\_(ツ)_/¯
 */
import 'comp/PostContainer.vue'
import 'comp/ControlPanel.vue'
import 'comp/Loading.vue'
import 'comp/PostList.vue'
import 'comp/ThreadControl.vue'
import 'comp/ThreadFooter.vue'
import 'comp/ThreadView.vue'

// Deps
import Vue from 'vue'
import {mapGetters} from 'vuex'
import * as _ from 'lodash'
import Thread from 'types/thread.js'
import store from './store'
import isProd from 'utils/isProd'
import UserConfig from 'types/userConfig';

// Legacy imports
const Ipfs = require('ipfs')
const OrbitDB = require('orbit-db')

// Set up IPFS
import ipfsConfig from 'utils/ipfs.config'
const node = new Ipfs(ipfsConfig)

// Register a global custom directive called `v-focus`
Vue.directive('focus', {
  // When the bound element is inserted into the DOM...
  inserted: function (el) {
    // Focus the element
    el.focus()
  }
})
// Init root Vue node
import App from 'comp/App.vue'
const vm = new Vue({
  el: '#root',
  store,
  computed: mapGetters(['dbReady']),
  components: {
    'app': App,
  },
})
// Show spinner until IPFS is ready
node.once('ready', () => node.id((err: Error, info: any) => {
  if (err) throw err
  const orbit = new OrbitDB(node)
  store.commit('updateIpfsNode', {newIpfsNode: node, newInfo: info})
  store.commit('updateDB', {newDB: orbit})

  // Needs to wait on node info to populate (You) nickname
  // Retrieve user profile configs from storage backend
  store.state.globalConfig.getResolve<string[]>('users').then(
    userStrings => {
      let users = userStrings || []
      // If no user profiles are found, populate the default one
      if (userStrings === undefined) {
        store.state.globalConfig.put('users', ['default'])
        users = ['default']
      }
      // Add retrieved profiles to the global store
      users.forEach(userName => {
        store.dispatch('addUserConfig', new UserConfig(userName))
      })
    }
  )
}))
