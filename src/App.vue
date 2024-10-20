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

const moveChild = () => {
  context.pushChanges({
    type: 'move',
    from: ['children', 0, 'props', 'title', 0],
    path: ['children', 0, 'props', 'title', 1]
  })
  context.updateChanges()
}

const invalidSetSchema = () => {
  context.schema.props.title = 'updated';
  context.updateChanges()
}

</script>

<template>

  <div>
    <button @click="addChild">add child</button>
    <button @click="addTitle">add title</button>
    <button @click="setStyle">set style</button>
    <button @click="delStyle">delete style</button>
    <button @click="moveChild">move child</button>
    <button @click="invalidSetSchema">invalid set schema</button>
  </div>

  <div>
    <pre>{{ context.schema }}</pre>
  </div>

</template>

<style scoped></style>
