<template>
  <div class="control-panel">
    <div class="ipfs-node-id-display">Your node ID is: <span class="hash">{{nodeId}}</span></div>
    <div class="right-options">
      <label>User profile</label>
      <select placeholder="default" v-model="selectedUser" @change="userChange">
        <option disabled value="">-</option>
        <option v-for="user in users" :key="user" :value="user">{{user}}</option>
      </select>
      <button @click="showAddUserPanel">NEW</button>
    </div>
    <hr class="control-separater">
    <div v-if="addUserPanelShown" class="add-user-panel">
      <div class="right-options">
        <input type="text" v-model="newUser">
        <button @click="addUser" :disabled="addingUser">ADD</button>
      </div>
      <hr>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import UserConfig from 'types/userConfig';

@Component
export default class ControlPanel extends Vue {
  selectedUser: string = "default"
  addUserPanelShown: boolean = false
  newUser: string = ""
  addingUser: boolean = false

  get users() {
    return Object.keys(this.$store.getters.userConfigs)
  }

  get nodeId() {
    return this.$store.state.ipfsInfo.id
  }

  userChange() {
    this.$store.commit('updateUser', {newUser: this.selectedUser})
  }

  async addUser() {
    this.addingUser = true
    const newUser = this.newUser.slice(0) // clone
    this.newUser = "Adding..."
    await this.$store.dispatch('addUserConfig', new UserConfig(newUser))
    this.newUser = ""
    this.addUserPanelShown = false
    this.addingUser = false
  }

  showAddUserPanel() {
    this.addUserPanelShown = true
  }
}
</script>

<style lang="scss">
.control-panel {
  font-size: 1em;
}
.ipfs-node-id-display {
  display: inline;
}
.right-options {
  float: right;
}
.control-separater {
  clear: both;
  margin: 0;
}
</style>
