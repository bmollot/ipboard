import isProd from 'utils/isProd'
// Use a random repo location each load while in development to prevent cache conflicts
const repo = isProd ? 'ipfs/dib/repo' : 'ipfs/dib/test-repo-' + Math.random()
export default {
  repo,
  config: {
    Addresses: {
      Swarm: [ // Use a known bootstrap node from libp2p.io team
        '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
      ],
    },
  },
  EXPERIMENTAL: {
    pubsub: true,
  },
}