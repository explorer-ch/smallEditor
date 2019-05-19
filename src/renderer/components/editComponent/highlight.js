export function highlight (ast, chars) {
  console.log('update')
  let tokens = ast.tokens
  tokens.forEach((token) => {
    if (token.type.keyword) {
      let startPos = {...token.loc.start}
      let endPos = {...token.loc.end}
      if (startPos.line === endPos.line) {
        let lcol = startPos.column
        let rcol = endPos.column
        let linechar = chars[startPos.line - 1]
        for (let i = 0; i < linechar.length; i++) {
          let len = linechar[i].val.length
          if (lcol >= 0 && rcol <= len - 1) {
            let inserts = []
            if (lcol !== 0) {
              let obj1 = {}
              obj1.type = 'normal'
              obj1.val = linechar[i].val.slice(0, lcol)
              inserts.unshift(obj1)
            }
            let obj2 = {}
            obj2.type = 'keyword'
            obj2.val = linechar[i].val.slice(lcol, rcol + 1)
            inserts.unshift(obj2)
            if (rcol !== len - 1) {
              let obj3 = {}
              obj3.type = 'normal'
              obj3.val = linechar[i].val.slice(rcol + 1)
              inserts.unshift(obj3)
            }
            inserts.forEach((item) => {
              chars[startPos.line - 1].splice(i + 1, 0, item)
            })
            chars[startPos.line - 1].splice(i, 1)
            break
          } else {
            lcol -= len
            rcol -= len
          }
        }
      }
    }
  })
}
