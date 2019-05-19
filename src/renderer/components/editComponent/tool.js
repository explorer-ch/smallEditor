export function getlinetxt (txts) {
  let linetxt = ''
  txts.forEach((txt) => {
    linetxt += txt.val
  })
  return linetxt
}

export function changeMousePos (mousex, mousey, grid) {
  let gridx = 0
  let cursorXpos = 0
  let gridy = Math.floor(mousey / 20)
  if (gridy > grid.length - 1) {
    gridy = grid.length - 1
    gridx = grid[gridy].slice(-1)
    cursorXpos = grid[gridy].length - 1
  } else {
    let largeX = grid[gridy].slice(-1)
    if (mousex > largeX) {
      gridx = largeX
      cursorXpos = grid[gridy].length - 1
    } else {
      let posindex = grid[gridy].findIndex((val) => {
        return val >= mousex
      })
      let leftnum = grid[gridy][posindex - 1]
      let rightnum = grid[gridy][posindex]
      let middle = (leftnum + rightnum) / 2
      if (mousex >= leftnum && mousex <= middle) {
        gridx = leftnum
        cursorXpos = posindex - 1
      } else {
        gridx = rightnum
        cursorXpos = posindex
      }
    }
  }
  return { gridx, gridy, cursorXpos }
}

export function computeChoose (oldPos, newPos, edited, choosedlefts, choosedwids, chooselater) {
  if (chooselater) {
    for (let i = oldPos.y; i < newPos.y + 1; i++) {
      if (i === oldPos.y) {
        choosedlefts.splice(i, 1, edited[i][oldPos.x])
        if (newPos.y === oldPos.y) {
          choosedwids.splice(i, 1, newPos.x - edited[i][oldPos.x])
        } else {
          choosedwids.splice(i, 1, edited[i].slice(-1)[0] - edited[i][oldPos.x])
        }
      } else {
        choosedlefts.splice(i, 1, 0)
        if (i === newPos.y) {
          choosedwids.splice(i, 1, newPos.x)
        } else {
          choosedwids.splice(i, 1, edited[i].slice(-1)[0])
        }
      }
    }
    choosedwids = choosedwids.map((item, index) => {
      if (index > newPos.y) {
        return 0
      } else {
        return item
      }
    })
    choosedlefts = choosedlefts.map((item, index) => {
      if (index > newPos.y) {
        return 0
      } else {
        return item
      }
    })
  } else {
    for (let i = newPos.y; i < oldPos.y + 1; i++) {
      if (i === newPos.y) {
        choosedlefts.splice(i, 1, newPos.x)
        if (i === oldPos.y) {
          choosedwids.splice(i, 1, edited[i][oldPos.x] - newPos.x)
        } else {
          choosedwids.splice(i, 1, edited[i].slice(-1)[0] - newPos.x)
        }
      } else {
        choosedlefts.splice(i, 1, 0)
        if (i === oldPos.y) {
          choosedwids.splice(i, 1, edited[i][oldPos.x])
        } else {
          choosedwids.splice(i, 1, edited[i].slice(-1)[0])
        }
      }
    }
    choosedwids = choosedwids.map((item, index) => {
      if (index < newPos.y) {
        return 0
      } else {
        return item
      }
    })
    choosedlefts = choosedlefts.map((item, index) => {
      if (index < newPos.y) {
        return 0
      } else {
        return item
      }
    })
  }
  return { choosedlefts, choosedwids }
}

export function getChoosedContent (startx, starty, endx, endy, chars, edited) {
  let choosetxt = ''
  let chooseedited = []
  if (starty === endy) {
    if (startx < endx) {
      choosetxt += getlinetxt(chars[starty]).slice(startx, endx)
      let cedit = edited[starty].slice(startx + 1, endx + 1)
      let left = edited[starty][startx]
      cedit = cedit.map((item) => {
        return item - left
      })
      chooseedited.push(cedit)
    } else {
      choosetxt += getlinetxt(chars[starty]).slice(endx, startx)
      let cedit = edited[starty].slice(endx + 1, startx + 1)
      let left = edited[starty][endx]
      cedit = cedit.map((item) => {
        return item - left
      })
      chooseedited.push(cedit)
    }
  } else {
    let chooseDirect = starty <= endy
    let lefty = starty
    let leftx = startx
    let righty = endy
    let rightx = endx
    let cedit, left
    if (!chooseDirect) {
      lefty = endy
      leftx = endx
      righty = starty
      rightx = startx
    }
    for (let i = lefty; i < righty + 1; i++) {
      if (i === lefty) {
        choosetxt += getlinetxt(chars[i]).slice(leftx) + '\n'
        cedit = edited[i].slice(leftx + 1)
        left = edited[i][leftx]
        cedit = cedit.map((item) => {
          return item - left
        })
        chooseedited.push(cedit)
      } else if (i === rightx) {
        choosetxt += getlinetxt(chars[i]).slice(0, rightx)
        cedit = edited[i].slice(1, rightx + 1)
        left = edited[i][0]
        cedit = cedit.map((item) => {
          return item - left
        })
        chooseedited.push(cedit)
      } else {
        choosetxt += getlinetxt(chars[i]) + '\n'
        cedit = edited[i].slice(1)
        chooseedited.push(cedit)
      }
    }
  }
  return { choosetxt, chooseedited }
}

export function clearChoosed (choosels, choosews) {
  choosels = choosels.map((item) => {
    return 0
  })
  choosews = choosews.map((item) => {
    return 0
  })
  return { choosels, choosews }
}

export function clearchoosedCon (oldx, oldy, newx, newy, edited, chars) {
  let leftx = oldx
  let lefty = oldy
  let rightx = newx
  let righty = newy
  let dellen = 0
  if (newy < oldy || (oldy === newy && oldx > newx)) {
    leftx = newx
    lefty = newy
    rightx = oldx
    righty = oldy
  }
  for (let i = lefty; i < righty + 1; i++) {
    if (i === lefty) {
      if (lefty === righty) {
        let lastedit = edited[i].slice(rightx + 1)
        let leftedit = edited[i].slice(0, leftx + 1)
        lastedit = lastedit.map((item) => {
          return item - edited[i][rightx] + edited[i][leftx]
        })
        let insert = leftedit.concat(lastedit)
        let lasttxt = leftx - 1 >= 0 ? chars[i][0].val.slice(0, leftx) : ''
        lasttxt += chars[i][0].val.slice(rightx)
        if (insert.length > 1) {
          edited.splice(i, 1, insert)
          chars[i][0].val = lasttxt
        } else {
          edited.splice(i, 1)
          chars.splice(i, 1)
          dellen += 1
        }
      } else {
        let lastedit = edited[i].slice(0, leftx + 1)
        let lasttxt = leftx - 1 >= 0 ? chars[i][0].val.slice(0, leftx) : ''
        if (lastedit.length > 1) {
          edited.splice(i, 1, lastedit)
          chars[i][0].val = lasttxt
        } else {
          edited.splice(i, 1)
          chars.splice(i, 1)
          dellen += 1
        }
      }
    } else if (i === righty) {
      let lastedit = edited[i - dellen].slice(rightx + 1)
      let lasttxt = chars[i - dellen][0].val.slice(rightx)
      lastedit = lastedit.map((item) => {
        return item - edited[i - dellen][rightx]
      })
      lastedit.unshift(0)
      if (lastedit.length > 1) {
        edited.splice(i - dellen, 1, lastedit)
        chars[i - dellen][0].val = lasttxt
      } else {
        edited.splice(i - dellen, 1)
        chars.splice(i - dellen, 1)
        dellen += 1
      }
    } else {
      edited.splice(i - dellen, 1)
      chars.splice(i - dellen, 1)
      dellen += 1
    }
  }
  return { leftx, lefty }
}

export function pasteText (copyX, copyY, copychar, chars, copyedited, edited) {
  mergelinetxt(chars)
  let copyH = copyedited.length
  let lastcon = edited[copyY].slice(copyX + 1)
  let uaddlen = edited[copyY][copyX]
  lastcon = lastcon.map((item) => {
    return item - uaddlen
  })
  let lasttxt = chars[copyY][0].val.slice(copyX)
  edited.splice(copyY, 1, edited[copyY].slice(0, copyX + 1))
  chars[copyY][0].val = chars[copyY][0].val.slice(0, copyX)
  for (let i = 0; i < copyH - 1; i++) {
    edited.splice(copyY + 1, 0, [])
    chars.splice(copyY + 1, 0, [ { type: 'normal', val: '' } ])
  }
  for (let j = copyY; j < copyY + copyH; j++) {
    let addlen = edited[j].slice(-1)[0]
    copyedited[j - copyY] = copyedited[j - copyY].map((item) => {
      return item + addlen
    })
    let insertedit = edited[j].concat(copyedited[j - copyY])
    let inserttxt = chars[j][0].val + copychar[j - copyY]
    if (j === copyY + copyH - 1) {
      inserttxt = inserttxt + lasttxt
      addlen = insertedit.slice(-1)[0]
      lastcon = lastcon.map((item) => {
        return item + addlen
      })
      insertedit = insertedit.concat(lastcon)
    }
    chars[j][0].val = inserttxt
    edited.splice(j, 1, insertedit)
  }
}

export function mergelinetxt (chars) {
  for (let i = 0; i < chars.length; i++) {
    let val = ''
    let obj = {}
    chars[i].forEach((item) => {
      val += item.val
    })
    obj.val = val
    obj.type = 'normal'
    chars.splice(i, 1, [obj])
  }
}
