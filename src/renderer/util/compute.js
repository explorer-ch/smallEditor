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
          choosedwids.splice(i, 1, edited[i].slice(-1)[0])
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
          choosedwids.splice(edited[i].slice(-1)[0])
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
