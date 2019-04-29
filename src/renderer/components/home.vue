<template>
  <div class="wrapper" @mousemove="dragging" :style="{'cursor':draggState?'e-resize':'default'}">
    <div class="menu" :style="{width:menuWid+'px'}">
      <div class="folder" v-if="filemes.path">
        FOLDERS
        <folder :foldermes="filemes"></folder>
      </div>
      <div class="point" @mousedown="draggStart" @mouseup="draggEnd"></div>
    </div>
    <workspace :menuWid="menuWid"></workspace>
  </div>
</template>

<script>
  import folder from './folder'
  import workspace from './workspace'
  import { ipcRenderer } from 'electron'

  export default {
    name: 'home',
    data () {
      return {
        menuWid: 200,
        draggState: false,
        draggPos: 0,
        filemes: { name: '', path: '', data: [] }
      }
    },
    mounted () {
      ipcRenderer.on('fsTree', (event, message) => {
        console.log(message)
        this.filemes = message
      })
    },
    components: {
      folder,
      workspace
    },
    methods: {
      draggStart (e) {
        this.draggState = true
        this.draggPos = e.clientX
      },
      dragging (e) {
        if (this.draggState) {
          let move = e.clientX - this.draggPos
          this.menuWid += move
          this.draggPos = e.clientX
        }
      },
      draggEnd (e) {
        this.draggState = false
      }
    }
  }
</script>

<style>
  @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
  .wrapper{
    width:100%;
    height:100%;
  }
  .menu{
    height:100%;
    background:#ededed;
    display:flex;
    flex-direction:row;
    float:left;
  }
  .folder{
    flex:1;
    font-size:16px;
    overflow:auto;
    padding:10px;
    color:gray;
  }
  .point{
    width:3px;
    height:100%;
    cursor:e-resize;
    float:right;
  }
</style>

