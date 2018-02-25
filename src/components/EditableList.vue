<template>
  <div class="editable-list">
    <div><input type="text" v-model="toAdd"><button @click="addEntry(toAdd)">ADD</button></div>

    <div v-if="associative">
      <div v-for="(v,k) in map" :key="k" class="editable-list-entry">
        <span>{{ k }}</span>
        <input type="text" :value="v" @input="updateEntry(k, $event.target.value)">
        <button @click="removeEntry(k)">REMOVE</button>
      </div>
    </div>

    <div v-else>
      <div v-for="(v,i) in arr" :key="v" class="editable-list-entry">
        <span>{{ v }}</span>
        <button @click="removeEntry(i)">REMOVE</button>
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

interface stringmap {[key: string]: string}
function isMap(x: stringmap | string[]): x is stringmap {
  return !Array.isArray(x)
}

@Component({
  props: ['value']
})
export default class EditableList extends Vue {
  value: stringmap | string[]

  toAdd: string = ""

  get map(): stringmap{
    if (isMap(this.value)) return this.value
    else return {}
  }
  get arr(): string[] {
    if (!isMap(this.value)) return this.value
    else return []
  }
  associative: boolean

  created() {
    if (isMap(this.value)) {
      this.associative = true
    } else {
      this.associative = false
    }
  }

  update() {
    this.$emit('input', this.associative ? this.map : this.arr)
  }

  addEntry(name: string) {
    if (this.toAdd === '') {
      return
    }
    if (this.associative) {
      Vue.set(this.map, name, "")
    }
    else {
      this.arr.push(name)
    }
    this.toAdd = ""
    this.update()
  }

  updateEntry(key: string, value: string) {
    if (this.associative) {
      Vue.set(this.map, key, value)
      this.update()
    } else {
      console.error("Tried to update value in array (no logical operation)", this, key, value)
    }
  }

  removeEntry(keyOrIndex: string | number) {
    if (this.associative && typeof keyOrIndex === 'string') {
      Vue.delete(this.map, keyOrIndex)
      this.update()
    }
    else if (typeof keyOrIndex === 'number') {
      this.arr.splice(keyOrIndex, 1)
      this.update()
    } else {
      console.log("Tried to remove from ", this.associative ? this.map : this.arr, " with ", keyOrIndex)
    }
  }
}
</script>

<style lang="scss">
.editable-list {
  display: flex;
  flex-direction: column;
  width: fit-content;
  width: -moz-fit-content;
}

.editable-list-entry {
  display: flex;
  span {
    flex-grow: 1;
    margin-right: 0.5em;
  }
}
</style>
