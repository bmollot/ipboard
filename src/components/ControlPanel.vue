<template>
  <div class="control-panel">
    <div class="control-top">
      <div class="ipfs-node-id-display">Your node ID is: <span class="hash">{{nodeId}}</span></div>
      <div>
        <span>{{selectedUser}}</span>
        <button @click="toggleControlUserPanel">⚙</button>
      </div>
    </div>
    
    <div v-if="controlUserPanelShown" class="control-user-panel">

      <div class="control-user-header">
        <div>
          <label for="editing-user">User profile</label>
          <select
            name="editing-user"
            placeholder="default"
            :value="selectedUser"
            @change="userChange($event.target.value)"
          >
            <option disabled value="">-</option>
            <option v-for="user in users" :key="user" :value="user">{{user}}</option>
          </select>
        </div>

        <div>
          <input type="text" v-model="newUser">
          <button @click="addUser" :disabled="addingUser">ADD</button>
        </div>
      </div>

      <div>
        <label for="nick-name">Nick</label>
        <input type="text" name="nick-name" placeholder="Anonymous" v-model="user.data.nickName">
      </div>

      <div class="control-user-settings">
        <div>
          <input name="horizontal-posts" type="checkbox" v-model="user.data.horizontalPosts">
          <label for="horizontal-posts">Horizontal Posts</label>
        </div>
      </div>

      <div class="control-user-lists">
        <div class="list">
          <div class="title">Pet Names</div>
          <editable-list v-model="user.data.petNames"></editable-list>
        </div>
        <div class="list">
          <div class="title">Blocked Ids</div>
          <editable-list v-model="user.data.blockedNodes"></editable-list>
        </div>
      </div>

      <div class="control-user-footer">
        <button @click="saveUser">SAVE</button>
        <div class="flex-spacer"></div>
      </div>

    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import EditableList from 'comp/EditableList.vue'

import UserConfig from 'types/userConfig'
import LocalStore from 'types/localStore'

@Component({
  components: {
    'editable-list': EditableList,
  }
})
export default class ControlPanel extends Vue {
  controlUserPanelShown: boolean = false
  newUser: string = ""
  addingUser: boolean = false
  saving: boolean = false
  
  get selectedUser(): string {
    return this.$store.state.currentUser
  }
  get user(): LocalStore<UserConfig> {
    return this.userConfigs[this.selectedUser]
  }

  created() {
    // this.user = this.userConfigs[this.selectedUser]
  }

  get users() {
    return Object.keys(this.userConfigs)
  }

  get userConfigs() {
    return this.$store.getters.userConfigs
  }

  get nodeId() {
    return this.$store.state.ipfsInfo.id
  }

  userChange(user: string) {
    this.$store.commit('updateUser', {newUser: user})
    // this.user = this.$store.getters.userConfigs[this.selectedUser]
  }

  async saveUser() {
    this.saving = true
    await this.user.save()
    this.saving = false
  }

  async addUser() {
    this.addingUser = true
    const newUser = this.newUser.slice(0) // clone
    this.newUser = "Adding..."
    await this.$store.dispatch('addUserConfig', new UserConfig(newUser))
    this.newUser = ""
    this.addingUser = false
  }

  toggleControlUserPanel() {
    this.controlUserPanelShown = !this.controlUserPanelShown
  }
}
</script>

<style lang="scss">
@import '~styles/colors';

.control-panel {
  font-size: 1em;
  display: flex;
  flex-direction: column;
}
.control-top {
  display: flex;
  justify-content: space-between;
}

.control-user-panel {
  border-top: 1px solid $fg;

  background-color: $lbg;
  display: flex;
  flex-direction: column;
  padding: 1em;
}
.control-user-header {
  display: flex;
}
.control-user-settings {
  display: flex;
  flex-wrap: wrap;
  margin: 1em;
}
.control-user-lists {
  display: flex;
  flex-wrap: wrap;
  .list {
    margin: {
      right: 1em;
      bottom: 0.5em;
    }
    .title {
      font-weight: bold;
      text-decoration: underline;
    }
    background-color: $llbg;
    display: flex;
    flex-direction: column;
  }
}
.control-user-footer {
  display: flex;
}

.flex-spacer {
  flex-grow: 100;
}
</style>
