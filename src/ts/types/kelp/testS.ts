import Kelp from './index'
const IPFS = require('ipfs')

const node = new IPFS({
  repo: 'jsipfs-' + Math.random(),
  EXPERIMENTAL: {
    pubsub: true
  }
})

console.log("Node created", node)

node.once('ready', async () => {
  const log = new Kelp(node, 'test-topic')
  await log.init()
  ;(<any>global).log = log
  console.log("Node ready", log)
  log.onupdate = e => {
    console.log("Got new entry", e)
    console.log("New ordered list", log._log.ordered)
  }
})
