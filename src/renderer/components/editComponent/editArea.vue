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
      <pre class="linetextCon" v-for="(vals,indexs) in valArr" :key="indexs">
        <span class="textCon" v-for="(val,index) in vals" :key="index + 'c'" :class="lightclass(val.type)">{{val.val}}</span>
      </pre>
      <pre class="measureTool" ref="tool">{{charBlock}}</pre> <!--辅助测量字符宽度-->
      <div class="cursor" :style="{display:cursorShow?'block':'none',left:tlpos+'px',top:thpos+'px'}"></div>
    </div>
  </div>
</template>

<script>
  import { ipcRenderer } from 'electron'
  import { changeMousePos, computeChoose, getChoosedContent, pasteText, clearChoosed, clearchoosedCon, getlinetxt, mergelinetxt } from './tool.js'
  import { getAst } from '../../util/getAst'
  import { highlight } from './highlight.js'
  import './editArea.css'
  import '../../css/highLight.css'
  
  export default {
    name: 'editArea',
    props: ['menuWid', 'tabh', 'txt', 'pos', 'id', 'ctab', 'copydata', 'editstate'],
    data () {
      return {
        valArr: [[{ type: 'normal', val: '' }]],
        line: 0,
        cursorShow: false,
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
        ischoosed: false,
        choosestartxPos: 0,
        choosestartyPos: 0,
        chooseendxPos: 0,
        chooseendyPos: 0,
        bug: false, /* 解决mouseup与click冲突的bug */
        highLightChange: false /* 该变量每一次变化触发高亮 */
      }
    },
    computed: {
      filetype () {
        return this.id.split('.').slice(-1)[0]
      }
    },
    watch: {
      highLightChange () {
        let mess = ''
        for (let i = 0; i < this.valArr.length; i++) {
          mess += getlinetxt(this.valArr[i]) + '\n'
        }
        try {
          let ast = getAst(mess, this.filetype) /* 语法高亮 */
          if (ast) {
            highlight(ast, this.valArr)
          }
        } catch (err) {
          window.alert('hi,语法错误')
        }
      }
    },
    mounted () {
      let xnum = 0
      let ynum = -1
      this.editing = this.editstate
      document.addEventListener('mousemove', (e) => {
        e.preventDefault()
      })
      ipcRenderer.on('savefile', (event) => {
        if (!this.editing) return ''
        if (this.id === this.ctab) {
          let messobj = {}
          let mess = ''
          for (let i = 0; i < this.valArr.length; i++) {
            mess += getlinetxt(this.valArr[i]) + '\n'
          }
          messobj.data = mess
          messobj.path = this.id
          this.editing = false
          this.$emit('changeEdit', { key: this.id, state: this.editing })
          this.$emit('write', messobj)
        }
      })
      ipcRenderer.on('markdownView', (event) => {
        if (this.id === this.ctab && this.filetype === 'md') {
          let mess = ''
          for (let i = 0; i < this.valArr.length; i++) {
            mess += getlinetxt(this.valArr[i]) + '\n'
          }
          ipcRenderer.send('markdownTransform', mess)
        }
      })
      this.$refs.editArea.focus()
      let txts = this.txt.split(/[\n\r]/)
      this.valArr = txts.map((item) => {
        let obj = {}
        obj.val = item
        obj.type = 'normal'
        return [obj]
      })
      let linenum = this.valArr.length
      for (let i = 0; i < linenum - 1; i++) {
        this.choosedwids.push(0)
        this.choosedlefts.push(0)
      }
      let ast = getAst(this.txt, this.filetype) /* 语法高亮 */
      highlight(ast, this.valArr)
      /* 计算edited */
      let initEdit = setInterval(() => {
        if (xnum === linenum) {
          this.computeState = false
          this.$store.commit('initEnd', this.id)
          this.edited.pop()
          clearInterval(initEdit)
        } else {
          if (ynum !== -1) {
            this.edited[xnum].push(this.$refs.tool.offsetWidth)
          }
          let len = 0
          this.valArr[xnum].forEach((item) => {
            len += item.val.length
          })
          if (ynum === (len - 1)) {
            xnum++
            ynum = -1
            this.edited.push([0])
          } else {
            ynum++
          }
          this.charBlock = this.valArr[xnum] ? getlinetxt(this.valArr[xnum]).slice(0, ynum + 1) : ''
        }
      }, 0)
    },
    methods: {
      readyEdit (e) {
        if (this.bug) {
          this.ischoosed = false /* 点击会取消选择 */
          let cleardata = clearChoosed(this.choosedlefts, this.choosedwids)
          this.choosedlefts = cleardata.choosels
          this.choosedwids = cleardata.choosews
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
        /* 复制功能 */
        if (key === 67 && e.ctrlKey && (e.key >= 'a' && e.key <= 'z')) {
          if (this.ischoosed) {
            let chooseddata = getChoosedContent(this.choosestartxPos, this.choosestartyPos, this.chooseendxPos, this.chooseendyPos, this.valArr, this.edited)
            this.$emit('copyEvent', chooseddata)
          }
          return ''
        }
        /* 粘贴功能 */
        if (key === 86 && e.ctrlKey && (e.key >= 'a' && e.key <= 'z')) {
          if (this.ischoosed) {
            let cleardata = clearChoosed(this.choosedlefts, this.choosedwids)
            this.choosedlefts = cleardata.choosels
            this.choosedwids = cleardata.choosews
            this.ischoosed = false
            return ''
          }
          if (this.copydata.iscopy) {
            this.editing = true
            let copytxt = this.copydata.copytxt.split(/[\n\r]/)
            let copyEdited = this.copydata.copyEdited
            pasteText(this.cursorXpos, this.line, copytxt, this.valArr, copyEdited, this.edited)
            this.highLightChange = !this.highLightChange
            this.$emit('changeEdit', { key: this.id, state: this.editing })
          }
          return ''
        }
        /* 字符与数字键 */
        if ((key >= 65 && key <= 90) || (key >= 48 && key <= 57) || key === 32 || key === 13 || (key >= 219 && key <= 222) || (key >= 186 && key <= 191)) {
          this.editing = true
          if (this.ischoosed) {
            let cleardata = clearChoosed(this.choosedlefts, this.choosedwids)
            this.choosedlefts = cleardata.choosels
            this.choosedwids = cleardata.choosews
            let newpos = clearchoosedCon(this.choosestartxPos, this.choosestartyPos, this.chooseendxPos, this.chooseendyPos, this.edited, this.valArr)
            this.cursorXpos = newpos.leftx
            this.line = newpos.lefty
            this.tlpos = this.edited[this.line][this.cursorXpos]
            this.thpos = this.line * 20
            this.ischoosed = false
          }
          if (key === 13) {
            mergelinetxt(this.valArr)
            let newlinetxt = this.valArr[this.line][0].val.slice(this.cursorXpos)
            let newlineedited = this.edited[this.line].slice(this.cursorXpos + 1)
            let deditedlen = this.edited[this.line].length - this.cursorXpos - 1
            let mark = this.edited[this.line][this.cursorXpos]
            newlineedited = newlineedited.map((item) => {
              return item - mark
            })
            newlineedited.unshift(0)
            this.valArr[this.line][0].val = this.valArr[this.line][0].val.slice(0, this.cursorXpos)
            this.edited[this.line].splice(this.cursorXpos + 1, deditedlen)
            this.line += 1
            this.cursorXpos = 0
            this.tlpos = 0
            this.thpos += 20
            if (this.line > this.edited.length - 1) {
              this.edited.push(newlineedited)
              this.valArr.push([{ type: 'normal', val: newlinetxt }])
              this.choosedwids.splice(0)
              this.choosedlefts.splice(0)
            } else {
              this.edited.splice(this.line, 0, newlineedited)
              this.valArr.splice(this.line, 0, [{ type: 'normal', val: newlinetxt }])
              this.choosedwids.splice(this.line, 0, 0)
              this.choosedlefts.splice(this.line, 0, 0)
            }
            this.highLightChange = !this.highLightChange
          } else {
            let leftval = this.valArr[this.line][0].val.slice(0, this.cursorXpos) + e.key
            let nval = leftval + this.valArr[this.line][0].val.slice(this.cursorXpos)
            this.charBlock = leftval
            setTimeout(() => {
              this.tlpos = this.$refs.tool.offsetWidth
              this.edited[this.line].splice(this.cursorXpos + 1, 0, this.tlpos)
            }, 0)
            this.valArr[this.line][0].val = nval
            this.cursorXpos++
            this.highLightChange = !this.highLightChange
          }
        }
        /* 清除键 */
        if (key === 8) {
          mergelinetxt(this.valArr)
          this.editing = true
          if (this.cursorXpos === 0 && this.line === 0) return ''
          if (this.ischoosed) {
            let newpos = clearchoosedCon(this.choosestartxPos, this.choosestartyPos, this.chooseendxPos, this.chooseendyPos, this.edited, this.valArr)
            this.cursorXpos = newpos.leftx
            this.line = newpos.lefty
            this.tlpos = this.edited[this.line][this.cursorXpos]
            this.thpos = this.line * 20
            let cleardata = clearChoosed(this.choosedlefts, this.choosedwids)
            this.choosedlefts = cleardata.choosels
            this.choosedwids = cleardata.choosews
            this.ischoosed = false
            return ''
          }
          if (this.cursorXpos === 0) {
            let txt = this.valArr[this.line][0].val
            let edited = this.edited[this.line]
            edited.shift()
            this.valArr.splice(this.line, 1)
            this.edited.splice(this.line, 1)
            this.choosedwids.splice(this.line, 1)
            this.choosedlefts.splice(this.line, 1)
            this.line--
            this.cursorXpos = this.edited[this.line].length - 1
            this.valArr[this.line][0].val += txt
            let mark = this.edited[this.line].slice(-1)[0]
            edited = edited.map((item) => {
              return item + mark
            })
            this.edited[this.line] = this.edited[this.line].concat(edited)
            this.tlpos = this.edited[this.line][this.cursorXpos]
            this.thpos -= 20
            return ''
          }
          let nval = this.valArr[this.line][0].val.slice(0, this.cursorXpos - 1) + this.valArr[this.line][0].val.slice(this.cursorXpos)
          this.charBlock = this.valArr[this.line][0].val.slice(this.cursorXpos, this.cursorXpos + 1)
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
            this.valArr[this.line][0].val = nval
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
          this.highLightChange = !this.highLightChange
        }
        /* 左移键 */
        if (key === 37) {
          let cleardata = clearChoosed(this.choosedlefts, this.choosedwids)
          this.choosedlefts = cleardata.choosels
          this.choosedwids = cleardata.choosews
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
          let cleardata = clearChoosed(this.choosedlefts, this.choosedwids)
          this.choosedlefts = cleardata.choosels
          this.choosedwids = cleardata.choosews
          this.editing = true
          if (this.line === 0) return ''
          this.line--
          this.cursorXpos = this.edited[this.line].length - 1
          this.tlpos = this.edited[this.line][this.cursorXpos]
          this.thpos -= 20
        }
        /* 右移键 */
        if (key === 39) {
          let cleardata = clearChoosed(this.choosedlefts, this.choosedwids)
          this.choosedlefts = cleardata.choosels
          this.choosedwids = cleardata.choosews
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
          let cleardata = clearChoosed(this.choosedlefts, this.choosedwids)
          this.choosedlefts = cleardata.choosels
          this.choosedwids = cleardata.choosews
          this.editing = true
          if (this.line === this.edited.length - 1) return ''
          this.line++
          this.cursorXpos = this.edited[this.line].length - 1
          this.tlpos = this.edited[this.line][this.cursorXpos]
          this.thpos += 20
        }
        this.$emit('changeEdit', { key: this.id, state: this.editing })
        if (this.filetype === 'md') {
          let md = ''
          this.valArr.map((txt) => {
            md += txt + '\n'
          })
          this.$emit('updatePre', md)
        }
      },
      /* 选择要复制的字符 */
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
        this.chooseendxPos = data.cursorXpos
        this.chooseendyPos = data.gridy
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
        this.ischoosed = true /* 表明有选择的内容 */
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
      },
      lightclass (type) {
        switch (type) {
          case 'keyword':
            return 'keylight'
          default:
            return ''
        }
      }
    }
  }
</script>

<style> 
</style>