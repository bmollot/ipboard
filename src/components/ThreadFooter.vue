<template>
  <div class="thread-footer">
    <div class="compose-post-area" v-if="composing">
      <div class="upload-container">
        <div class="upload-preview-container">
          <canvas
            v-once
            class="upload-preview"
            ref="canvas"
            :width="previewWidth"
            :height="previewHeight"
          ></canvas>
        </div>
        <input ref="filein" type="file" @change="uploadAttachment">
      </div>
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

@Component
export default class ThreadFooter extends Vue {
  composing: boolean = false
  textToPost: string = ""
  thumbnailDataUrl?: string = undefined
  attachedFile?: File = undefined
  previewWidth = MAX_THUMBNAIL_DIM
  previewHeight = MAX_THUMBNAIL_DIM
  
  postClicked() {
    this.$emit('new-post', this.textToPost, this.attachedFile, this.thumbnailDataUrl)
    this.textToPost = ""
    this.thumbnailDataUrl = undefined
    this.attachedFile = undefined
    let input = this.$refs.filein
    if (input instanceof HTMLInputElement) {
      input.value = ""
    }
    this.composing = false
  }
  toComposeMode() {
    this.composing = true
    // Force an update for PostList... for some reason. Likely has to do with scrolling.
    this.$parent.$children.forEach(x => {
      if (x.$vnode.tag && x.$vnode.tag.includes('PostList')) {
        x.$forceUpdate()
      }
    })
    // Focuse the textarea next tick, as it's not rendered yet
    let that = this
    this.$nextTick().then(() => {
      let ta = that.$refs.textarea
      if (ta instanceof HTMLElement) {
        ta.focus()
      }
    })
  }
  cancelCompose() {
    this.composing = false
  }
  clearComposed() {
    this.textToPost = ""
  }

  replyTo(postId: string) {
    if (!this.composing) {
      this.toComposeMode()
      this.textToPost += `>>${postId}\n`
    }
    else {
      let ta = this.$refs.textarea
      if (ta instanceof HTMLElement) {
        ta.focus()
      }
      this.textToPost += `>>${postId} ` // the space is intentional
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
  // display: flex;
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

