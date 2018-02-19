<template>
  <div class="thread-footer">
    <div class="compose-post-area" v-if="composing">
      <textarea
        ref="textarea"
        cols="60" rows="10"
        v-model="textToPost"
        resize="none"
      ></textarea>
      <div class="compose-action-container">
        <button @click="postClicked">SUBMIT</button>
        <button @click="cancelCompose">CANCEL</button>
        <button @click="clearComposed">CLEAR</button>
      </div>
      <div class="upload-container">
        <div class="upload-preview-container">
          <canvas
            class="upload-preview"
            ref="canvas"
            :width="previewWidth"
            :height="previewHeight"
          ></canvas>
        </div>
        <input ref="filein" type="file" @change="uploadAttachment">
        <div class="upload-ready">{{prettyUploadReady}}</div>
      </div>
    </div>
    <div v-else>
      <button @click="toComposeMode">POST</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import PostList from 'comp/PostList.vue'

import {MAX_THUMBNAIL_DIM} from 'ts/constants'

@Component({
  props: ['uploadStatus']
})
export default class ThreadFooter extends Vue {
  uploadStatus: {
    uploading: File | null
    done: boolean
    results: {
      path: string,
      hash: string,
      size: number // bytes
    } | null
  }

  composing: boolean = false
  textToPost: string = ""
  thumbnailDataUrl?: string = undefined
  attachedFile?: File = undefined
  previewWidth = MAX_THUMBNAIL_DIM
  previewHeight = MAX_THUMBNAIL_DIM

  get prettyUploadReady(): string {
    if (this.uploadStatus.uploading !== null && this.uploadStatus.uploading === this.attachedFile) {
      return this.uploadStatus.done ? 'DONE' : 'UPLOADING'
    }
    else {
      return 'No file selected'
    }
  }
  
  postClicked() {
    // If we have a file that's done uploading, include relevant info in the post event
    const res = this.uploadStatus.results
    if (this.attachedFile && this.attachedFile === this.uploadStatus.uploading && this.uploadStatus.done && res) {
      this.$emit('new-post', this.textToPost, {
        name: this.attachedFile.name,
        mime: this.attachedFile.type,
        path: res.path,
        content: res.hash,
        size: res.size,
        thumbnail: this.thumbnailDataUrl
      })
    }
    // Otherwise exclude it, making a text-only post
    else {
      this.$emit('new-post', this.textToPost)
    }

    // In any case, perfrom cleanup so the next post will be fresh
    this.textToPost = ""
    this.thumbnailDataUrl = undefined
    this.attachedFile = undefined
    let input = this.$refs.filein
    if (input instanceof HTMLInputElement) {
      input.value = ""
    }
    this.clearAttachment()
    this.composing = false
  }
  toComposeMode(action?: () => void) {
    this.composing = true
    // Force an update for PostList... for some reason. Likely has to do with scrolling.
    this.$parent.$children.forEach(x => {
      if (x.$vnode.tag && x.$vnode.tag.includes('PostList')) {
        x.$forceUpdate()
      }
    })
    // Focuse the textarea next tick, as it's not rendered yet
    let self = this
    this.$nextTick().then(() => {
      let ta = self.$refs.textarea
      if (ta instanceof HTMLElement) {
        ta.focus()
      }
      if (action && typeof action === 'function') action()
    })
  }
  cancelCompose() {
    this.composing = false
  }
  clearComposed() {
    this.textToPost = ""
  }

  replyTo(postId: string) {
    this.textToPost += `>>${postId}\n`
    if (!this.composing) {
      this.toComposeMode()
    }
    else {
      let ta = this.$refs.textarea
      if (ta instanceof HTMLElement) {
        ta.focus()
      }
    }
  }

  clearAttachment() {
    this.thumbnailDataUrl = undefined
    this.attachedFile = undefined
    const canvas = this.$refs.canvas
    if (canvas instanceof HTMLCanvasElement) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, this.previewWidth, this.previewHeight)
      }
    }
  }

  uploadAttachment() {
    this.clearAttachment()

    let input = this.$refs.filein
    let canvas = this.$refs.canvas
    if (input instanceof HTMLInputElement && canvas instanceof HTMLCanvasElement) {
      let files = input.files
      if (files !== null && files.length >= 1) {
        const f = this.attachedFile = files.item(0)
        // Uploaded file is an image, so we can preview it meaningfully
        if (f.type.startsWith('image')) {
          const image = new Image()
          const self = this
          image.src = URL.createObjectURL(f)
          image.onload = () => {
            const ctx = (<HTMLCanvasElement>canvas).getContext('2d')
            if (ctx) {
              let w = image.naturalWidth
              let h = image.naturalHeight
              if (w >= h) {
                let ratio = h / w
                w = MAX_THUMBNAIL_DIM
                h = ratio * w
              } else {
                let ratio = w / h
                h = MAX_THUMBNAIL_DIM
                w = ratio * h
              }
              ctx.drawImage(image, 0, 0, w, h)
              self.thumbnailDataUrl = (<HTMLCanvasElement>canvas).toDataURL()
              image.remove()
            }
          }
        }
        // Persist file to IPFS
        this.$emit('upload-file', f)
      }
    }
  }
}
</script>

<style lang="scss">
.thread-footer {
  display: flex;
  max-height: 25vh;
}
.compose-post-area {
  flex-grow: 1;
  display: flex;
  flex-direction: row;
}
.upload-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.upload-preview-container {
  flex-grow: 1;
}
.upload-preview-container * {
  margin-left: auto;
  margin-right: auto;
  max-width: 100%;
  max-height: 100%;
}
.compose-action-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
</style>

