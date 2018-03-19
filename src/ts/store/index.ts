import Vue from 'vue'
import Vuex from 'vuex'

import LocalStore from 'types/localStore'
import UserConfig from 'types/userConfig'
import ThreadConfig from 'types/threadConfig'
import isProd from 'utils/isProd'

Vue.use(Vuex)

interface stringToLocalStore<T> {
  [name: string]: LocalStore<T>
}

export default new Vuex.Store({
  state: {
    ipfsNode: <any>null,
    ipfsInfo: {
      id: "",
      publicKey: "",
    },
    globalData: new LocalStore(isProd ? 'global/data' : 'global/data-dev'),
    globalConfig: new LocalStore(isProd ? 'global/config' : 'global/config-dev'),
    userConfigs: <stringToLocalStore<UserConfig>>{},
    threadConfigs: <stringToLocalStore<ThreadConfig>>{},
    currentUser: "default",
  },
  getters: {
    isDBReady: state => state.ipfsNode !== null,
    areUsersReady: state => Object.keys(state.userConfigs).length !== 0,
    userConfigs: state => state.userConfigs,
    threadConfigs: state => state.threadConfigs,
  },
  mutations: {
    updateIpfsNode(state, {newIpfsNode, newInfo}) {
      state.ipfsNode = newIpfsNode,
      state.ipfsInfo = newInfo
    },
    updateUserConfig(state, newUser: LocalStore<UserConfig>) {
      Vue.set(state.userConfigs, newUser.data.userName, newUser)
    },
    updateThreadConfig(state, newThread: LocalStore<ThreadConfig>) {
      newThread.save()
      Vue.set(state.threadConfigs, newThread.data.threadName, newThread)
    },
    updateUser(state, {newUser}) {
      console.log("b", state)
      state.currentUser = newUser
      console.log('a', state)
      state.globalConfig.put('currentUser', newUser)
    },
  },
  actions: {
    async addUserConfig({state}, newUser: UserConfig) {
      const user = LocalStore.from<UserConfig>(newUser)
      await user.load()
      Vue.set(state.userConfigs, newUser.userName, user)
      const users = await state.globalConfig.getResolve<string[]>('users')
      if (users) {
        users.push(newUser.userName)
        await state.globalConfig.put('users', [...new Set<string>(users)])
      } else {
        await state.globalConfig.put('users', [newUser.userName])
      }
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