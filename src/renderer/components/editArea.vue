<template>
  <div class="editedArea" ref="editArea" tabindex="0" @keydown="write" @click="readyEdit" @blur="endEdit">
    <div class="loading" v-show="computeState" ref="ani">
      <div class="loadCenter"></div>
    </div>
    <div class="lineNums">
      <span class="lineNum" v-for="(val,index) in valArr" :key="index" :style="{'color':index==line?'white':'rgba(255,255,255,0.3)'}">{{index+1}}</span>
    </div>
    <div class="textArea" @mousedown="choosestart" @mousemove="chooseframeshow" @mouseup="chooseend">
      <div class="choosedframe" v-for="(val,index) in choosedlefts" :key="index+'frame'" :style="{top:index*20+'px',left:choosedlefts[index]+'px',width:choosedwids[index]+'px'}"></div>
      <pre class="textCon" v-for="(val,index) in valArr" :key="index">{{val}}</pre>
      <pre class="measureTool" ref="tool">{{charBlock}}</pre> <!--辅助测量字符宽度-->
      <div class="cursor" :style="{display:cursorShow?'block':'none',left:tlpos+'px',top:thpos+'px'}"></div>
    </div>
  </div>
</template>

<script>
  import { ipcRenderer } from 'electron'
  import { changeMousePos, computeChoose } from '../util/compute'

  export default {
    name: 'editArea',
    props: ['menuWid', 'tabh', 'txt', 'pos', 'id', 'ctab'],
    data () {
      return {
        valArr: [''],
        line: 0,
        cursorShow: true,
        cursorXpos: 0,
        tlpos: 0,
        thpos: 0,
        edited: [[0]],
        charBlock: '',
        computeState: true,
        editing: false,
        choosedlefts: [0],
        choosedwids: [0],
        chooseState: false,
        choosestartxPos: 0,
        choosestartyPos: 0,
        bug: false
      }
    },
    mounted () {
      let xnum = 0
      let ynum = -1
      document.addEventListener('mousemove', (e) => {
        e.preventDefault()
      })
      ipcRenderer.on('savefile', (event) => {
        if (!this.editing) return ''
        if (this.id === this.ctab) {
          let messobj = {}
          let mess = ''
          for (let i = 0; i < this.valArr.length; i++) {
            mess += this.valArr[i] + '\n'
          }
          messobj.data = mess
          messobj.path = this.id
          this.editing = false
          this.$emit('changeEdit', { key: this.id, state: this.editing })
          this.$emit('write', messobj)
        }
      })
      this.$refs.editArea.focus()
      this.valArr = this.txt.split(/[\n\r]/)
      let linenum = this.valArr.length
      for (let i = 0; i < linenum - 1; i++) {
        this.choosedwids.push(0)
        this.choosedlefts.push(0)
      }
      /* 计算edited */
      let initEdit = setInterval(() => {
        if (xnum === linenum) {
          this.computeState = false
          this.$store.commit('initEnd', this.id)
          console.log(this.edited)
          clearInterval(initEdit)
        } else {
          if (ynum !== -1) {
            this.edited[xnum].push(this.$refs.tool.offsetWidth)
          }
          if (ynum === (this.valArr[xnum].length - 1)) {
            xnum++
            ynum = -1
            this.edited.push([0])
          } else {
            ynum++
          }
          this.charBlock = this.valArr[xnum] ? this.valArr[xnum].slice(0, ynum + 1) : ''
        }
      }, 0)
    },
    methods: {
      readyEdit (e) {
        if (this.bug) {
          this.choosedwids = this.choosedwids.map(() => {
            return 0
          })
          this.choosedlefts = this.choosedlefts.map(() => {
            return 0
          })
        }
        if (e.target === this.$refs.ani) return ''
        let posX = e.clientX - this.menuWid - 30
        let posY = e.clientY + this.pos - this.tabh
        let data = changeMousePos(posX, posY, this.edited)
        this.cursorXpos = data.cursorXpos
        this.tlpos = data.gridx
        this.cursorShow = true
        this.line = data.gridy
        this.thpos = data.gridy * 20
      },
      endEdit (e) {
        this.cursorShow = false
      },
      write (e) {
        e.preventDefault()
        let key = e.keyCode
        /* 字符与数字键 */
        if ((key >= 65 && key <= 90) || (key >= 48 && key <= 57) || key === 32 || key === 13 || (key >= 219 && key <= 220) || (key >= 186 && key <= 191)) {
          this.editing = true
          if (key === 13) {
            let newlinetxt = this.valArr[this.line].slice(this.cursorXpos)
            let newlineedited = this.edited[this.line].slice(this.cursorXpos + 1)
            let deditedlen = this.edited[this.line].length - this.cursorXpos - 1
            let mark = this.edited[this.line][this.cursorXpos]
            newlineedited = newlineedited.map((item) => {
              return item - mark
            })
            newlineedited.unshift(0)
            this.valArr[this.line] = this.valArr[this.line].slice(0, this.cursorXpos)
            this.edited[this.line].splice(this.cursorXpos + 1, deditedlen)
            this.line += 1
            this.cursorXpos = 0
            this.tlpos = 0
            this.thpos += 20
            if (this.line > this.edited.length - 1) {
              this.edited.push(newlineedited)
              this.valArr.push(newlinetxt)
              this.choosedwids.splice(0)
              this.choosedlefts.splice(0)
            } else {
              this.edited.splice(this.line, 0, newlineedited)
              this.valArr.splice(this.line, 0, newlinetxt)
              this.choosedwids.splice(this.line, 0, 0)
              this.choosedlefts.splice(this.line, 0, 0)
            }
          } else {
            let leftval = this.valArr[this.line].slice(0, this.cursorXpos) + e.key
            let nval = leftval + this.valArr[this.line].slice(this.cursorXpos)
            this.charBlock = leftval
            setTimeout(() => {
              this.tlpos = this.$refs.tool.offsetWidth
              this.edited[this.line].splice(this.cursorXpos + 1, 0, this.tlpos)
            }, 0)
            this.valArr.splice(this.line, 1, nval)
            this.cursorXpos++
          }
        }
        /* 清除键 */
        if (key === 8) {
          this.editing = true
          if (this.cursorXpos === 0 && this.line === 0) return ''
          if (this.cursorXpos === 0) {
            let txt = this.valArr[this.line]
            let edited = this.edited[this.line]
            edited.shift()
            this.valArr.splice(this.line, 1)
            this.edited.splice(this.line, 1)
            this.choosedwids.splice(this.line, 1)
            this.choosedlefts.splice(this.line, 1)
            this.line--
            this.cursorXpos = this.edited[this.line].length - 1
            this.valArr[this.line] += txt
            let mark = this.edited[this.line].slice(-1)[0]
            edited = edited.map((item) => {
              return item + mark
            })
            this.edited[this.line] = this.edited[this.line].concat(edited)
            this.tlpos = this.edited[this.line][this.cursorXpos]
            this.thpos -= 20
            return ''
          }
          let nval = this.valArr[this.line].slice(0, this.cursorXpos - 1) + this.valArr[this.line].slice(this.cursorXpos)
          this.charBlock = this.valArr[this.line].slice(this.cursorXpos, this.cursorXpos + 1)
          if (nval === '' && this.line !== 0) {
            this.valArr.splice(this.line, 1)
            this.edited.splice(this.line, 1)
            this.choosedwids.splice(this.line, 1)
            this.choosedlefts.splice(this.line, 1)
            this.line--
            this.cursorXpos = this.edited[this.line].length - 1
            this.tlpos = this.edited[this.line][this.cursorXpos]
            this.thpos -= 20
          } else {
            this.valArr.splice(this.line, 1, nval)
            this.cursorXpos--
            this.tlpos = this.edited[this.line][this.cursorXpos]
            this.edited[this.line].splice(this.cursorXpos + 1, 1)
            setTimeout(() => {
              this.edited[this.line] = this.edited[this.line].map((val, index) => {
                if (index <= this.cursorXpos) {
                  return val
                } else {
                  return val - this.$refs.tool.offsetWidth
                }
              })
            }, 0)
          }
        }
        /* 左移键 */
        if (key === 37) {
          this.editing = true
          if (this.cursorXpos === 0) {
            if (this.line === 0) return ''
            this.line--
            this.cursorXpos = this.edited[this.line].length - 1
            this.tlpos = this.edited[this.line][this.cursorXpos]
            this.thpos -= 20
          } else {
            this.cursorXpos--
            this.tlpos = this.edited[this.line][this.cursorXpos]
          }
        }
        /* 上移键 */
        if (key === 38) {
          this.editing = true
          if (this.line === 0) return ''
          this.line--
          this.cursorXpos = this.edited[this.line].length - 1
          this.tlpos = this.edited[this.line][this.cursorXpos]
          this.thpos -= 20
        }
        /* 右移键 */
        if (key === 39) {
          this.editing = true
          if (this.cursorXpos === this.edited[this.line].length - 1) {
            if (this.line === this.edited.length - 1) return ''
            this.line++
            this.cursorXpos = 0
            this.tlpos = 0
            this.thpos += 20
          } else {
            this.cursorXpos++
            this.tlpos = this.edited[this.line][this.cursorXpos]
          }
        }
        /* 下移键 */
        if (key === 40) {
          this.editing = true
          if (this.line === this.edited.length - 1) return ''
          this.line++
          this.cursorXpos = this.edited[this.line].length - 1
          this.tlpos = this.edited[this.line][this.cursorXpos]
          this.thpos += 20
        }
        this.$emit('changeEdit', { key: this.id, state: this.editing })
      },
      chooseframeshow (e) {
        if (!this.chooseState) return ''
        let posX = e.clientX - this.menuWid - 30
        let posY = e.clientY + this.pos - this.tabh
        let data = changeMousePos(posX, posY, this.edited)
        let cgridx = data.gridx
        let cgridy = data.gridy
        this.tlpos = data.gridx
        this.thpos = data.gridy * 20
        this.line = data.gridy
        this.cursorXpos = data.cursorXpos
        let oldpos = {}
        let newpos = {}
        oldpos.x = this.choosestartxPos
        oldpos.y = this.choosestartyPos
        newpos.x = cgridx
        newpos.y = cgridy
        let chooselater = false
        if (this.choosestartyPos < cgridy || (this.choosestartyPos === cgridy && this.choosestartxPos < data.cursorXpos)) chooselater = true
        let returnState = computeChoose(oldpos, newpos, this.edited, this.choosedlefts, this.choosedwids, chooselater)
        this.choosedlefts = returnState.choosedlefts
        this.choosedwids = returnState.choosedwids
      },
      choosestart (e) {
        this.choosedwids = this.choosedwids.map(() => {
          return 0
        })
        this.choosedlefts = this.choosedlefts.map(() => {
          return 0
        })
        let posX = e.clientX - this.menuWid - 30
        let posY = e.clientY + this.pos - this.tabh
        let data = changeMousePos(posX, posY, this.edited)
        this.cursorXpos = data.cursorXpos
        this.tlpos = data.gridx
        this.cursorShow = true
        this.line = data.gridy
        this.thpos = data.gridy * 20
        this.choosestartxPos = data.cursorXpos
        this.choosestartyPos = data.gridy
        this.chooseState = true
        this.bug = false
      },
      chooseend () {
        this.chooseState = false
        setTimeout(() => {
          this.bug = true /* 定时器用来解决mouseup与click冲突的bug */
        }, 1000)
      }
    }
  }
</script>

<style> 
  .editedArea{
    background:#1e1e1e;
    color:white;
    font-size:18px;
    font-family:consolas;
    position:relative;
    display:flex;
    flex-direction:row;
  }
  .loading{
    position:absolute;
    width:100%;
    height:100%;
    z-index:10;
    background:#1e1e1e;
  }
  .loadCenter{
    position:absolute;
    left:50%;
    top:100px;
    transform:translateY(-50%);
    width:40px;
    height:40px;
    border-radius:50%;
    animation:loading 1s linear infinite;
    background:white;
  }
  @keyframes loading {
    from{
      width:40px;
      height:40px;
    }
    to{
      width:60px;
      height:60px;
    }
  }
  .editedArea:focus{
    outline:none;
  }
  .lineNums{
    width:30px;
    display:flex;
    flex-direction:column;
  }
  .lineNum{
    color:rgba(255,255,255,0.3);
    width:30px;
    height:20px;
    text-align:center;
    display:inline-block;
  }
  .textArea{
    cursor:text;
    flex:1;
    position:relative;
  }
  .textCon{
    margin:0px;
    height:20px;
  }
  .choosedframe{
    position:absolute;
    height:20px;
    background:rgba(100,100,100,0.4);
  }
  .cursor{
  	width:2px;
  	height:20px;
  	position:absolute;
  	animation: twinkle 1s infinite;
  }
  @keyframes twinkle {
  	from { background:white;}
  	to { background:#1e1e1e;}
  }
  .measureTool{
    margin:0px;
    display:inline-block;
    height:20px;
    opacity:0;
  }
</style>