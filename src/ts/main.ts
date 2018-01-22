// Import styles for bundling
import 'normalize.css'
import 'styles/base.sass'

import Thread from 'types/thread.js'
import Vue from 'vue'
const Ipfs = require('ipfs')
const OrbitDB = require('orbit-db')

import * as _ from 'lodash'

function repo() {
  return 'ipfs/ipboard/' + Math.random()
}
const node = new Ipfs({
  repo: repo(),
  config: {
    Addresses: {
      Swarm: [
        '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
      ],
    },
  },
  EXPERIMENTAL: {
    pubsub: true,
  },
})

_.assign(window, {
  bus: new Vue(),
  node: node,
})

import App from 'comp/App.vue'
import Loading from 'comp/Loading.vue'

// Import here, even though they aren't use, or else HardSourceWebpackPlugin breaks
import 'comp/ControlPanel.vue'
import 'comp/PostContainer.vue'
import 'comp/PostList.vue'
import 'comp/ThreadFooter.vue'
import 'comp/ThreadView.vue'


// Init root Vue node
const vm = new Vue({
  el: '#root',
  data: {
    dbReady: false,
    db: null,
  },
  components: {
    'app': App,
    'loading': Loading,
  },
})

node.once('ready', () => node.id((err: Error, info: any) => {
  if (err) throw err
  console.log('IPFS node id: ' + info.id)
  const orbit = new OrbitDB(node)
  vm.db = orbit
  vm.dbReady = true
}))
