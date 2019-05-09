import Vue from 'vue'

Vue.directive('light', {
  update (el, binding) {
    /* if (binding && binding.value !== binding.oldValue) {
      const tokens = binding.value.tokens
      let pres = el.getElementsByClassName('textCon')
      setTimeout(() => {
        insertcolor(tokens, pres)
      }, 0)
    } */
  }
})

/* function insertcolor (tokens, pres) {
  tokens.map((token) => {
    if (token.type.keyword) {
      let startPos = {...token.loc.start}
      let endPos = {...token.loc.end}
      let pre = pres[startPos.line - 1]
      let prechild = {...pre.childNodes}
      let txtlens = []
      let changes = []
      prechild.length = pre.childNodes.length
      for (let i = 0; i < prechild.length; i++) {
        if (prechild[i].nodeType === 3) {
          txtlens.push(prechild[i].length)
        } else {
          txtlens.push(prechild[i].childNodes[0].length)
        }
      }
      let lcol = startPos.column + 1
      let rcol = endPos.column + 1
      for (let j = 0; j < txtlens.length; j++) {
        let obj = {}
        if (lcol > txtlens[j]) {
          lcol -= txtlens[j]
          rcol -= txtlens[j]
        } else if (rcol <= txtlens[j]) {
          obj.num = j
          obj.l = lcol
          obj.r = rcol
          changes.push(obj)
          break
        } else if (txtlens[j] >= lcol && txtlens < rcol) {
          obj.num = j
          obj.l = lcol
          obj.r = txtlens[j]
          changes.push(obj)
          lcol = 1
          rcol -= txtlens[j]
        }
      }
      for (let k = 0; k < changes.length; k++) {
        let change = changes[k]
        let cnode = prechild[change.num]
        if (cnode.nodeType === 3) {
          let txt = cnode.splitText(change.l - 1)
          txt.splitText(change.r - change.l + 1)
          let ctxt = txt.cloneNode(true)
          let colortxt = document.createElement('span')
          colortxt.setAttribute('class', 'keylight')
          colortxt.appendChild(ctxt)
          pre.replaceChild(colortxt, txt)
        }
      }
    }
  })
} */
