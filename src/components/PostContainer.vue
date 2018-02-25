<template>
  <div
    :id="'post-' + post.id"
    class="post-container"
    :class="userConfig.data.horizontalPosts ? 'post-horizontal' : ''"
    v-if="!blocked">
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
          <div class="post-petname">{{ prettyPet }}</div>
          <div class="post-timestamp">{{ prettyTime }}</div>
          <div class="post-id hash link"><span @click="replyTo">{{ prettyId }}</span></div>
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
                <img :src="previewSrc" :alt="attachmentAlt">
              </a>
            </div>
            <div v-else
              @click="toggleMediaExpanded"
              :style="'cursor: ' + (fetchingAttachment ? 'progress' : 'pointer')">
              <img :src="previewSrc" :alt="attachmentAlt">
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
          <a
            :href="'#post-' + referencerId"
            @mouseover="ev => highlight(ev, referencerId)"
            @mouseout="ev => unhighlight(ev, referencerId)"
          >>>{{prettifyId(referencerId)}}#</a>
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

import mimeThumb from 'utils/mimeThumb'

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
  mounted() {
    // for all child elements of class post-post-link (links to another post)...
    const refs = this.$el.querySelectorAll('.post-post-link')
    for (let i = 0; i < refs.length; i++) {
      const ref = refs.item(i)
      // that have an href value...
      const href = ref.getAttribute('href')
      if (href !== null) {
        // which contains a string in the form of a base-58 multihash...
        const res = /[0-z]{46}/g.exec(href)
        if (res != null) {
          // add event listeners for highlighting the linked post on hover
          const linkedPostId = res[0]
          const self = this
          ref.addEventListener('mouseover', ev => {
            self.highlight(ev, linkedPostId)
          })
          ref.addEventListener('mouseout', ev => {
            self.unhighlight(ev, linkedPostId)
          })
          // and set link text
          ref.textContent = `>>${this.prettifyId(linkedPostId)}#${ref.textContent}`
        }
      }
    }
  }

  highlight(ev: Event, postId: string) {
    // Strip (You)s and transform to element id
    const id = 'post-' + postId
    const target = document.getElementById(id)
    if (target !== null) {
      target.classList.add('post-highlighted')
      const clone = target.cloneNode(true)
      if (clone instanceof HTMLElement) {
        clone.id += '-clone'
        clone.style.position = 'fixed'
        const rect = (<HTMLElement>ev.target).getBoundingClientRect()
        clone.style.left = rect.left + 'px'
        clone.style.top = rect.top - target.getBoundingClientRect().height + 'px'
        this.$el.appendChild(clone)
      }
    }
  }
  unhighlight(ev: Event, postId: string) {
    // Strip (You)s and transform to element id
    const id = 'post-' + postId
    const target = document.getElementById(id)
    if (target !== null) {
      target.classList.remove('post-highlighted')
    }
    const clone = document.getElementById(id + '-clone')
    if (clone !== null) {
      clone.remove()
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
  // Return this post's author's pet name in parenthesis, or the empty string if no pet name has been given
  get prettyPet(): string {
    return this.petNames[this.fromId] ? `(${this.petNames[this.fromId]})` : ''
  }
  get prettyId(): string {
    return this.shortenId(this.post.id)
  }
  shortenId(id: string): string {
    return id.substr(-6,6)
  }
  // Return the given id shortened and with nick name appended
  prettifyId(id: string): string {
    const pet = this.petNameOf(id)
    return this.shortenId(id) + (pet !== '' ? ` (${pet})` : pet)
  }
  postFromId(id: string): Post | null {
    // Collect a list of posts that this id may belong to (should *really* always be a singleton list)
    const candidates = this.post.memberOf.reduce((a: Post[], x) => {
      const post = x._postById[id]
      if (post) {
        a.push(post)
      }
      return a
    }, [])
    // Post with the given id wasn't found in any known thread
    if (candidates.length < 1) {
      return null
    }
    return candidates[0]
  }
  petNameOf(id: string): string {
    const post = this.postFromId(id)
    return this.petNames[post ? post.fromId : ''] || ''
  }
  get prettyTime(): string {
    return new Date(this.post.timestamp).toLocaleString() // TODO: make formatting configurable
  }

  async updateFullSrc() {
    if (this.fetchingAttachment) return; // Do nothing if a fetch is in progress
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
    if (a) {
      if (a.thumbnail) {
        console.log("Rendering preview", a)
        return a.thumbnail
      }
      return mimeThumb(a.mime)
    }
    
    return "" // No attachment, no preview
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
@import '~styles/colors';
.post-horizontal {
  display: inline-block;
}
.post-highlighted {
  background-color: $lbg !important;
}
.post-container {
  padding: 0.5em;
  margin: {
    left: 0.2em;
    bottom: 0.2em;
  }
  width: -moz-fit-content;
  width: fit-content;
  max-width: calc(100vw - 1.4em);
  background-color: $llbg;
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
  color: $c8;
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
.post-media-content {
  margin: {
    left: 0.5em;
    top: 1em;
    right: 2em;
    bottom: 2em;
  }
  max-width: fit-content;
  max-height: fit-content;
  display: flex;
  flex-direction: column;
  float: left;
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
  margin: {
    left: 2em;
    top: 0.5em;
    bottom: 0.5em;
    right: 1em;
  }
  font-size: 1em;
  white-space: pre-wrap;
}
.post-footer {
  clear: both;
  word-wrap: break-word;
}
.post-referenced-by {
  display: inline;
  font-size: 0.8em;
  margin: {
    left: 0.2em;
    right: 0.2em;
  }
}
</style>

