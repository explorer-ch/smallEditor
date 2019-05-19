<template>
  <div class="workspace" ref="container" @mousemove="dragging">
   <div class="workCon" :style="{width:(1-previewWid)*conWid+'px'}">
  	<div class="tabBar" :style="{height:tabH+'px'}">
  	  <div class="tab" v-for="(tabmes, index) in tabmesArr" :key="index" :style="{'background':index===tabKey?'#1e1e1e':'rgba(255,255,255,0.1)'}" @click="changeTab(index)" :data-url="tabmes.allname">
  	    {{tabmes.name}}
  	    <i class="font iconfont" :class="{'icon-cha':!tabmes.editing,'icon-dian':tabmes.editing}" @click="del(index, $event)"></i>
  	  </div>
  	</div>
  	<div class="content" :style="{height:contentH+'px'}" ref="scroll">
      <editArea :menuWid="menuWid" :tabh="tabH" v-for="(tabmes, index) in tabmesArr" :key="tabmes.allname" :txt="tabmes.data" :editstate="tabmes.editing" :id="tabmes.allname" :ctab="ctabname" v-show="tabKey===index" :pos="scrollPos" @changeEdit="changeTabState" @write="sendwrite" @copyEvent="getcopydata" :copydata="{iscopy,copytxt,copyEdited}" @updatePre="updatehtml"></editArea>
    </div>
   </div>
   <div class="preview" v-if="preview" :style="{width:previewWid*conWid+'px'}">
     <div class="prepoint" @mousedown="draggStart" @mouseup="draggEnd"></div>
     <i class="prefont iconfont icon-cha" @click="closePreview"></i>
     <div class="htmlCon" ref="htmlCon"></div>
   </div>
  </div>
</template>

<script>
  import editArea from './editComponent/editArea'
  import { ipcRenderer } from 'electron'
  import markdown from 'markdown'

  export default {
    name: 'workspace',
    props: ['menuWid'],
    components: {
      editArea
    },
    mounted () {
      this.conWid = this.$refs.container.offsetWidth
      this.contentH = this.$refs.container.offsetHeight - 30
      window.onresize = () => {
        this.contentH = this.$refs.container.offsetHeight - 30
        this.conWid = this.$refs.container.offsetWidth
      }
      ipcRenderer.on('sendmes', (event, message) => {
        let res = this.tabmesArr.findIndex((val, index) => {
          return val.allname === message.allname
        })
        if (res === -1) {
          this.$store.commit('addTab', message)
          console.log(this.$store.state.Counter)
        }
      })
      ipcRenderer.on('newfile', (event) => {
        let newmes = {}
        newmes.allname = ''
        newmes.name = ''
        newmes.data = ''
        newmes.editing = true
        newmes.init = true
        let res = this.tabmesArr.findIndex((val, index) => {
          return val.allname === newmes.allname
        })
        if (res === -1) this.$store.commit('addTab', newmes)
      })
      ipcRenderer.on('changemes', (event, path) => {
        let data = {}
        data.allname = path
        data.name = path.split('\\').slice(-1)[0]
        let res = this.tabmesArr.findIndex((val, index) => {
          return val.allname === ''
        })
        data.key = res
        this.$store.commit('changemesname', data)
      })
      ipcRenderer.on('getHtml', (event, mess) => {
        if (!this.preview) {
          this.preview = true
          this.previewWid = 0.5
          setTimeout(() => {
            this.$refs.htmlCon.innerHTML = mess
          }, 0)
        }
      })
      let self = this
      this.$refs.scroll.addEventListener('scroll', function () {
        self.scrollPos = this.scrollTop
      })
    },
    data () {
      return {
        tabH: 30,
        contentH: 0,
        scrollPos: 0,
        copyEdited: [],
        copytxt: '',
        iscopy: false,
        preview: false,
        draggState: false,
        draggPos: 0,
        previewWid: 0,
        conWid: 0,
        preHtml: ''
      }
    },
    computed: {
      tabmesArr () {
        return this.$store.state.Counter.tabmesArr
      },
      tabKey () {
        return this.$store.state.Counter.tabKey
      },
      ctabname () {
        return this.$store.state.Counter.tabmesArr[this.$store.state.Counter.tabKey].allname
      }
    },
    methods: {
      changeTab (key) {
        this.$store.commit('changeKey', key)
      },
      del (key, e) {
        e.stopPropagation()
        if (!this.tabmesArr[key].init) {
          this.$store.commit('delTab', key)
        }
      },
      changeTabState (data) {
        this.$store.commit('changeTabstate', data)
      },
      sendwrite (mess) {
        ipcRenderer.send('writefile', mess)
      },
      getcopydata (data) {
        this.copytxt = data.choosetxt
        this.copyEdited = data.chooseedited
        this.iscopy = true
      },
      draggStart (e) {
        this.draggState = true
        this.draggPos = e.clientX
      },
      dragging (e) {
        if (this.draggState) {
          let move = e.clientX - this.draggPos
          this.previewWid -= move / this.conWid
          this.draggPos = e.clientX
        }
      },
      draggEnd (e) {
        this.draggState = false
      },
      closePreview (e) {
        this.preview = false
        this.previewWid = 0
      },
      updatehtml (md) {
        if (this.$refs.htmlCon) this.$refs.htmlCon.innerHTML = markdown.markdown.toHTML(md)
      }
    }
  }
</script>

<style>
  .workspace{
    background:#1e1e1e;
    height:100%;
    display:flex;
  }
  .preview{
    background:white;
    position:relative;
  }
  .prepoint{
    width:3px;
    height:100%;
    cursor:e-resize;
    position:absolute;
    left:0px;
  }
  .prefont{
    color:black;
    font-size:16px;
    position:absolute;
  }
  .htmlCon{
    height:100%;
    overflow:auto;
  }
  .tabBar{
  	background:rgba(255,255,255,0.3);
  	display:flex;
  	align-items:flex-end;
  }
  .tab{
  	width:100px;
  	height:30px;
  	display:flex;
  	color:white;
  	background:#1e1e1e;
  	justify-content:flex-end;
  	align-items:center;
  	border-right:1px solid white;
    text-overflow:clip;
    position:relative;
  }
  .tab:hover::before{
    content:attr(data-url);
    position:absolute;
    background:rgb(255,255,255);
    left:20%; 
    top:100%;
    color:black;
    z-index:20; 
  }
  .content{
    height:100%;
    overflow:auto;
  }
  .font{
  	font-size:10px;
  	color:rgba(255,255,255,0.3);
    margin:10px;
  }
  .font:hover{
  	color:white;
  }
</style>
