<template>
  <div class="workspace" ref="container">
  	<div class="tabBar" :style="{height:tabH+'px'}">
  	  <div class="tab" v-for="(tabmes, index) in tabmesArr" :key="index" :style="{'background':index===tabKey?'#1e1e1e':'rgba(255,255,255,0.1)'}" @click="changeTab(index)">
  	    {{tabmes.name}}
  	    <i class="font iconfont" :class="{'icon-cha':!tabmes.editing,'icon-dian':tabmes.editing}" @click="del(index, $event)"></i>
  	  </div>
  	</div>
  	<div class="content" :style="{height:contentH+'px'}" ref="scroll">
      <editArea :menuWid="menuWid" :tabh="tabH" v-for="(tabmes, index) in tabmesArr" :key="tabmes.allname" :txt="tabmes.data" :editstate="tabmes.editing" :id="tabmes.allname" :ctab="ctabname" v-show="tabKey===index" :pos="scrollPos" @changeEdit="changeTabState" @write="sendwrite" @copyEvent="getcopydata" :copydata="{iscopy,copytxt,copyEdited}"></editArea>
    </div>
  </div>
</template>

<script>
  import editArea from './editArea'
  import { ipcRenderer } from 'electron'

  export default {
    name: 'workspace',
    props: ['menuWid'],
    components: {
      editArea
    },
    mounted () {
      this.contentH = this.$refs.container.offsetHeight - 30
      window.onresize = () => {
        this.contentH = this.$refs.container.offsetHeight - 30
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
        iscopy: false
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
      }
    }
  }
</script>

<style>
  .workspace{
    background:#1e1e1e;
    height:100%;
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
  }
  .content{
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
