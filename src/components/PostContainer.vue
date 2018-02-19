<template>
  <div :id="'post-' + post.id" class="post-container" v-if="!blocked">
    <div v-if="optionsShown" class="post-options">
      <input type="text" v-model="newPetName" ref="petNameInput">
      <button @click="hide">HIDE</button>
      <button @click="block">BLOCK</button>
      <div class="post-options-right">
        <button class="post-options-save" @click="saveOptions">SAVE</button>
        <button class="post-options-close" @click="hideOptions">CLOSE</button>
      </div>
    </div>
    <div class="post" v-if="!(hidden || blocked)">
      <div class="post-header">

        <div class="post-header-row">
          <div class="post-nickname" :title="prettyFrom">{{ prettyNick }}</div>
          <div v-show="prettyPet !== ''" class="post-petname">({{ prettyPet }})</div>
          <div class="post-timestamp">{{ prettyTime }}</div>
          <div class="post-id hash"><span @click="replyTo">{{ prettyId }}</span></div>
          <div class="post-options-toggle">
            <span v-if="optionsShown" @click="hideOptions">▲</span>
            <span v-else @click="showOptions">▼</span>
          </div>
        </div>

        <div v-if="post.attachment" class="post-media-info post-header-row">
          <span v-if="fetchedAttachment"><a :href="fullSrc" :download="post.attachment.name">{{post.attachment.name}}</a></span>
          <span v-else>{{post.attachment.name}}</span>
          <span>{{post.attachment.size}}</span>
        </div>

      </div>
      <div class="post-body">
        <div v-if="post.attachment" class="post-media-content">

          <div v-if="attachmentType === 'IMAGE'">
            <div v-if="mediaExpanded && !fetchingAttachment" @click="toggleMediaExpanded">
              <img :src="fullSrc" :alt="attachmentAlt">
            </div>
            <div v-else class="post-thumbnail-container"
              @click="toggleMediaExpanded"
              :style="fetchingAttachment ? 'cursor: progress' : ''">
              <img :src="previewSrc" :alt="attachmentAlt" width="128">
            </div>
          </div>

          <div v-else>
            <div v-if="mediaExpanded && !fetchingAttachment">
              <a :href="fullSrc" :download="post.attachment.name">
                <img :src="otherFilePreview" :alt="attachmentAlt">
              </a>
            </div>
            <div v-else
              @click="toggleMediaExpanded"
              :style="'cursor: ' + (fetchingAttachment ? 'progress' : 'pointer')">
              <img :src="otherFilePreview" :alt="attachmentAlt">
            </div>
          </div>
          
          <div v-if="fetchingAttachment" style="flex-shrink='1'">Downloading...</div>
        </div>
        <div class="post-text-content" v-html="post.text"></div>
      </div>
      <div class="post-footer">
          <div class="post-referenced-by"
            v-for="referencerId in referencedBy"
            :key="referencerId">
            <a :href="'#post-' + referencerId">>>{{referencerId}}#</a>
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
import ThreadConfig from 'types/threadConfig'

import FilePng from 'res/img/file.png'

@Component({
  props: ['post', 'threadAddress']
})
export default class PostContainer extends Vue {
  post: Post
  threadAddress: string
  optionsShown: boolean = false
  newPetName: string = ""
  mediaExpanded: boolean = false
  fullSrc: string = ""
  _fileBlob: Blob | null = null
  fetchingAttachment = false
  attachmentType: 'NONE' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'OTHER' = 'NONE'
  otherFilePreview = FilePng

  created() {
    const a = this.post.attachment
    if (a) {
      if (a.mime.startsWith('image')) {
        this.attachmentType = 'IMAGE'
      } else if (a.mime.startsWith('video')) {
        this.attachmentType = 'VIDEO'
      } else if (a.mime.startsWith('audio')) {
        this.attachmentType = 'AUDIO'
      } else {
        this.attachmentType = 'OTHER'
      }
    } else {
      this.attachmentType = 'NONE'
    }
  }

  toggleMediaExpanded() {
    this.updateFullSrc()
    this.mediaExpanded = !this.mediaExpanded
  }

  get fetchedAttachment(): boolean {
    return this.fullSrc !== ''
  }

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

  // Look at my fancy ESnext syntax. Sets, spread, filter, map, and barely readable. Perfection.
  get referencedBy(): string[] {
    return [...new Set<string>(
      this.post.notes
        .filter(x => x.group && x.group === 'referenced-by' && x.message)
        .map(x => x.message)
    )]
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

  async updateFullSrc() {
    if (this.fetchingAttachment) return; // Do nothing if a fetch is in progress
    console.log("updateFullSrc called", this.fullSrc, this._fileBlob)
    const a = this.post.attachment
    // Only return a src uri if the post *has* an attachment
    if (a) {
      // Only fetch if data uri is missing
      if (!this.fullSrc || this.fullSrc === '') {
        this.fetchingAttachment = true
        // Get full file from IPFS and set dataUri for future reference
        const self = this
        this.$store.state.ipfsNode.files.get(a.content, async (err: Error | undefined, files: {path: string, content: Buffer}[]) => {
          console.log("Got file!", files)
          if (err) {
            console.error("Failed to get file for ", self, err)
            self.fetchingAttachment = false
            return
          }
          // Store downloaded data as a Blob on this component (will be cleaned by GC when this component is pruned)
          self._fileBlob = new Blob(files.map(x => x.content.buffer), {type: a.mime})
          // Get a uri to this in-memory blob to use as img src.
          self.fullSrc = URL.createObjectURL(self._fileBlob)
          self.fetchingAttachment = false
        })
        window.setTimeout(() => {
          
        }, a.size + 10000) // Give up after some time
      }
    }
  }
  get previewSrc(): string {
    const a = this.post.attachment
    if (a && a.thumbnail) {
      console.log("Rendering preview", a)
      return a.thumbnail
    }
    return "" // TODO: Replace with placeholder based on mimetype
  }
  get attachmentAlt(): string {
    const a = this.post.attachment
    if (a) {
      return a.name + ", " + a.mime
    }
    return "No attachment"
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
  hideOptions() {
    this.newPetName = ""
    this.optionsShown = false
  }
  saveOptions() {
    Vue.set(this.petNames, this.fromId, this.newPetName)
    this.userConfig.save()
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
.post {
  display: flex;
  flex-direction: column;
}
.post-options {
  display: flex;
}
.post-options-right {
  float: right;
}
.post-options-toggle:hover {
  color: #666666;
  cursor: pointer;
}
.post-header {
  display: flex;
  flex-direction: column;
}
.post-header-row div {
  display: inline;
  margin-right: 0.3em;
}
.post-nickname {
  font-weight: bold;
}
.post-petname {
  font-weight: 600;
}
.post-id {
  color: #0d56b4;
}
.post-id:hover {
  color: #0e3870;
  cursor: pointer;
}
.post-body {
  display: flex;
  flex-flow: wrap;
}
.post-media-content {
  margin-right: 1em;
  margin-bottom: 1em;
  max-width: fit-content;
  max-height: fit-content;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}
.post-media-content div {
  display: flex;
  flex-grow: 1;
  max-width: 100%;
  max-height: 100%;
}
.post-media-content div * {
  flex-grow: 1;
}
.post-thumbnail-container {
  max-width: 20vw;
  max-height: 20vh;
}
.post-text-content {
 font-size: 1.2em;
 white-space: pre-wrap;
}
.post-footer {
  clear: both;
  word-wrap: break-word;
}
.post-referenced-by {
  display: inline;
  font-size: 0.8em;
}
</style>

