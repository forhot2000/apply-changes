<script setup lang="ts">
import useContext from './context';

const context = useContext()


const addChild = () => {
  context.updateSchema({
    type: 'add',
    path: ['children', 0],
    value: context.createWidget('card')
  })
  context.syncChanges()
}

const addTitle = () => {
  context.updateSchema({
    type: 'add',
    path: ['children', 0, 'props', 'title', 0],
    value: context.createWidget('title')
  })
  context.syncChanges()
}

const setSchema = () => {
  context.schema.props.title = 'updated';
}

</script>

<template>

  <div>
    <button @click="addChild">add child</button>
    <button @click="addTitle">add title</button>
    <button @click="setSchema">set schema</button>
  </div>

  <div>
    <pre>{{ context.schema }}</pre>
  </div>

</template>

<style scoped></style>
