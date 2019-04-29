<template>
  <div class="folderCon">
  	<div class="pfile" @click="open">
  	  <i class="iconfont" :class="{'icon-jiantouarrow486':openState,'icon-jiantou':!openState}" v-show="!foldermes.isfile"></i><i class="iconfont" :class="{'icon-weibiaoti5':!foldermes.isfile&&!openState,'icon-file':foldermes.isfile,'icon-wenjianjia':!foldermes.isfile&&openState}"></i><span>{{foldermes.name}}</span>
  	</div>
  	<folder :foldermes="item" v-for="(item,index) in foldermes.data" :key="item.path" class="cfile" v-show="openState"></folder>
  </div>
</template>

<script>
  import { ipcRenderer } from 'electron'

  export default {
    name: 'folder',
    props: ['foldermes'],
    data () {
      return {
        openState: false
      }
    },
    methods: {
      open () {
        this.openState = !this.openState
        if (this.foldermes.isfile) {
          console.log(this.foldermes)
          ipcRenderer.send('reqRead', this.foldermes.allname)
        }
      }
    }
  }
</script>

<style>
  .folderCon{
  	display:flex;
  	flex-direction:column;
  }
  .pfile{
  	height:16px;
  	font-size:14px;
  	margin-top:10px;
  	margin-bottom:3px;
  }
  .pfile>span{
  	margin-left:3px;
  	color:black;
  }
  .cfile{
  	margin-left:20px;
  	margin-top:3px;
  	margin-bottom:3px;
  }
</style>