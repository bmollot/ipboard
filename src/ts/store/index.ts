import Vue from 'vue'
import Vuex from 'vuex'

import LocalStore from 'types/localStore'
import UserConfig from 'types/userConfig'
import ThreadConfig from 'types/threadConfig'
import isProd from 'utils/isProd'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    ipfsNode: <any>null,
    ipfsInfo: {
      id: "",
      publicKey: "",
    },
    database: <any>null,
    globalData: new LocalStore(isProd ? 'global/data' : 'global/data-' + Math.random()),
    globalConfig: new LocalStore(isProd ? 'global/config' : 'global/config-' + Math.random()),
    userConfigs: <any>{},
    threadConfigs: <any>{},
    currentUser: "default",
  },
  getters: {
    isDBReady: state => state.database !== null,
    userConfigs: state => state.userConfigs,
    threadConfigs: state => state.threadConfigs,
  },
  mutations: {
    updateIpfsNode(state, {newIpfsNode, newInfo}) {
      state.ipfsNode = newIpfsNode,
      state.ipfsInfo = newInfo
    },
    updateDB(state, {newDB}) {
      state.database = newDB
    },
    updateUserConfig(state, newUser: LocalStore<UserConfig>) {
      Vue.set(state.userConfigs, newUser.data.userName, newUser)
    },
    updateThreadConfig(state, newThread: LocalStore<ThreadConfig>) {
      newThread.save()
      Vue.set(state.threadConfigs, newThread.data.threadName, newThread)
    },
    updateUser(state, {newUser}) {
      state.currentUser = newUser
    },
  },
  actions: {
    async addUserConfig({state}, newUser: UserConfig) {
      const user = LocalStore.from<UserConfig>(newUser)
      await user.load()
      Vue.set(state.userConfigs, newUser.userName, user)
    },
    async addThreadConfig({state}, newThread: ThreadConfig) {
      const thread = LocalStore.from<ThreadConfig>(newThread)
      await thread.load()
      Vue.set(state.threadConfigs, newThread.threadName, thread)
    }
  },
  modules: {},
  plugins: [],
})