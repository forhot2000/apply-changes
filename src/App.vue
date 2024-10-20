<script setup lang="ts">
import useContext from './context';

const context = useContext()


const addChild = () => {
  context.pushChanges({
    type: 'add',
    path: ['children', 0],
    value: context.createWidget('card')
  })
  context.updateChanges()
}

const addTitle = () => {
  context.pushChanges({
    type: 'add',
    path: ['children', 0, 'props', 'title', 0],
    value: context.createWidget('title')
  })
  context.updateChanges()
}

const setStyle = () => {
  context.pushChanges({
    type: 'update',
    path: ['children', 0, 'props', 'style', 'position'],
    value: 'inline-block'
  })
  context.updateChanges()
}

const delStyle = () => {
  context.pushChanges({
    type: 'remove',
    path: ['children', 0, 'props', 'style', 'position']
  })
  context.updateChanges()
}

const delTitle = () => {
  context.pushChanges({
    type: 'remove',
    path: ['children', 0, 'props', 'title', 1]
  })
  context.updateChanges()
}

const delChild = () => {
  context.pushChanges({
    type: 'remove',
    path: ['children', 1]
  })
  context.updateChanges()
}

const moveTitle = () => {
  context.pushChanges({
    type: 'move',
    from: ['children', 0, 'props', 'title', 0],
    path: ['children', 0, 'props', 'title', 1]
  })
  context.updateChanges()
}

const moveChild = () => {
  context.pushChanges({
    type: 'move',
    from: ['children', 0],
    path: ['children', 1]
  })
  context.updateChanges()
}

const invalidSetSchema = () => {
  context.schema.props.title = 'updated';
  context.updateChanges()
}

</script>

<template>

  <div class="flex-wrap">
    <div class="group">
      <button @click="addChild">add child</button>
      <button @click="moveChild">move child</button>
      <button @click="delChild">delete child</button>
    </div>

    <div class="group">
      <button @click="addTitle">add title</button>
      <button @click="moveTitle">move title</button>
      <button @click="delTitle">delete title</button>
    </div>

    <div class="group">
      <button @click="setStyle">set style</button>
      <button @click="delStyle">delete style</button>
    </div>

    <div class="group">
      <button @click="invalidSetSchema">invalid set schema</button>
    </div>
  </div>

  <div class="output">
    <pre>{{ context.schema }}</pre>
  </div>

</template>

<style scoped>
.flex-wrap {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.group {
  display: flex;
  white-space: nowrap;
}

.group>* {
  border-left-style: none;
  border-width: 1px;
  padding: 5px 10px;
}

.group>*:first-child {
  border-left-style: solid;
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
}

.group>*:last-child {
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
}

.output {
  border: 1px solid black;
  border-radius: 5px;
  margin-top: 10px;
  padding: 0 10px;
}
</style>
