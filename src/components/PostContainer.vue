<template>
  <div :id="'post-' + post.id" class="post-container" v-if="!blocked">
    <div v-if="optionsShown" class="post-options">
      <input type="text" v-model="newPetName" ref="petNameInput">
      <button class="post-options-save" @click="saveOptions">SAVE</button>
      <button @click="hide">❌</button>
      <button @click="block">🔇</button>
    </div>
    <div class="post-body" v-if="!(hidden || blocked)">
      <div class="post-nickname" :title="prettyFrom" @dblclick="showOptions">{{ prettyNick }}</div>
      <div v-show="prettyPet !== ''" class="post-petname">({{ prettyPet }})</div>
      <div class="post-timestamp">{{ prettyTime }}</div>
      <div class="post-id hash"><span @click="replyTo">{{ prettyId }}</span></div>
      <br>
      <div class="post-media-content"></div>
      <div class="post-text-content" v-html="post.text"></div>
      <div class="post-footer">
        <div class="post-linked-from"
          v-for="postId in linkedFrom"
          :key="postId">
          <a :href="'#post-' + postId">>>{{postId}}#</a>
        </div>
      </div>
    </div>
    <div v-else-if="!blocked" class="post-hidden">
      <button @click="unhide">➕</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import {Post} from 'types/post'
import UserConfig from 'types/userConfig'
import LocalStore from 'types/localStore'
import ThreadConfig from 'types/threadConfig';

@Component({
  props: ['post', 'threadAddress', 'linkedFrom']
})
export default class PostContainer extends Vue {
  post: Post
  threadAddress: string
  linkedFrom: string[]
  optionsShown: boolean = false
  newPetName: string = ""

  get userConfigs(): any {
    return this.$store.getters.userConfigs
  }
  get currentUser(): string {
    return this.$store.state.currentUser
  }
  get userConfig() {
    let config = <LocalStore<UserConfig> | undefined> this.userConfigs[this.currentUser]
    if (config === undefined) {
      throw new Error(`Attempted to get config data for nonexistant user ${this.currentUser}`)
    } else {
      return config
    }
  }
  set userConfig(newConfig: LocalStore<UserConfig>) {
    newConfig.save()
    this.$store.commit('updateUserConfig', newConfig)
  }
  get petNames() {
    return this.userConfig.data.petNames
  }
  get threadConfig(): LocalStore<ThreadConfig> {
    return this.$store.getters.threadConfigs[this.threadAddress]
  }

  get hidden() {
    return this.threadConfig.data.hiddenPosts.includes(this.post.id)
  }
  get blocked() {
    return this.userConfig.data.blockedNodes.includes(this.post.fromId) && this.post.fromId !== this.$store.state.ipfsInfo.id
  }

  get prettyFrom(): string {
    return this.post.fromId
  }
  get prettyNick(): string {
    return this.post.profile.nickName || "Anonymous"
  }
  get fromId(): string {
    return this.post.fromId
  }
  get prettyPet(): string {
    return this.petNames[this.fromId] || ""
  }
  get prettyId(): string {
    return this.post.id
  }
  get prettyTime(): string {
    return new Date(this.post.timestamp).toLocaleString() // TODO make formatting configurable
  }
  
  block() {
    this.userConfig.data.blockedNodes.push(this.post.fromId)
    this.userConfig.save()
    this.optionsShown = false
  }
  hide() {
    this.threadConfig.data.hiddenPosts.push(this.post.id)
    this.threadConfig.save()
    this.optionsShown = false
  }
  unhide() {
    const self = this
    const i = this.threadConfig.data.hiddenPosts.findIndex(x => x === self.post.id)
    this.threadConfig.data.hiddenPosts.splice(i, 1)
    this.threadConfig.save()
    this.optionsShown = false
  }

  replyTo() {
    this.$emit('replyTo', this.post.id)
  }

  showOptions() {
    this.optionsShown = true
    const self = this
    this.$nextTick(() => {
      const input = self.$refs.petNameInput
      if (input instanceof HTMLElement) {
        input.focus()
      }
    })
  }
  saveOptions() {
    Vue.set(this.petNames, this.fromId, this.newPetName)
    this.userConfig.save()
    this.newPetName = ""
    this.optionsShown = false
  }
}
</script>

<style lang="scss">
.post-container {
  display: block;
  padding: 0.5em;
  margin: 0.1em;
  width: fit-content;
  max-width: calc(100vw - 1.4em);
  border: 1px solid black;
}
.post-nickname {
  display: inline;
  font-weight: bold;
}
.post-petname {
  display: inline;
  font-weight: 600;
}
.post-timestamp {
  display: inline;
}
.post-id {
  display: inline;
}
.post-text-content {
 font-size: 1.2em;
 white-space: pre-wrap;
}
.post-footer {
  word-wrap: break-word;
}
.post-linked-from {
  display: inline;
  font-size: 0.8em;
}
</style>

