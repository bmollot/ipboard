import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    ipfsNode: <any>null,
    ipfsInfo: {
      id: "",
      publicKey: "",
    },
    database: <any>null,
  },
  getters: {
    isDBReady: state => state.database !== null
  },
  mutations: {
    updateIpfsNode(state, {newIpfsNode, newInfo}) {
      state.ipfsNode = newIpfsNode,
      state.ipfsInfo = newInfo
    },
    updateDB(state, {newDB}) {
      state.database = newDB
    }
  },
  actions: {},
  modules: {},
  plugins: [],
})