'use strict'

import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron'
import fs from 'fs'
import markdown from 'markdown'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

function dfsFile (path, map) {
  let files = fs.readdirSync(path)
  for (let i = 0; i < files.length; i++) {
    let cmap = {}
    cmap.allname = path + '\\' + files[i]
    cmap.name = files[i]
    cmap.data = []
    map.data.push(cmap)
    cmap.isfile = fs.statSync(cmap.allname).isFile()
    if (!cmap.isfile) {
      dfsFile(cmap.allname, cmap)
    }
  }
}

const template = [{
  label: 'File',
  submenu: [
    { label: 'New File',
      click () {
        mainWindow.webContents.send('newfile')
      }
    },
    { label: 'Open File',
      click () {
        let filenames = dialog.showOpenDialog({
          properties: ['openFile']
        })
        if (filenames === undefined) return ''
        fs.readFile(filenames[0], 'utf8', (err, data) => {
          if (err) {
            dialog.showErrorBox('警告', '文件不能打开')
          } else {
            let mes = {}
            mes.allname = filenames[0]
            mes.name = filenames[0].split('\\').slice(-1)[0]
            mes.data = data
            mes.editing = false
            mes.init = true
            mainWindow.webContents.send('sendmes', mes)
          }
        })
      }
    },
    { label: 'Save',
      click () {
        mainWindow.webContents.send('savefile')
      }
    },
    {
      label: 'New Folders',
      click () {
        let map = {}
        let filebox = dialog.showOpenDialog({
          properties: ['openDirectory']
        })
        if (filebox === undefined) return ''
        map.path = filebox[0]
        map.name = filebox[0].split('\\').slice(-1)[0]
        map.isfile = false
        map.data = []
        dfsFile(filebox[0], map)
        mainWindow.webContents.send('fsTree', map)
      }
    }
  ]
},
{
  label: 'preview',
  submenu: [
    {
      label: 'markdown',
      click () {
        mainWindow.webContents.send('markdownView')
      }
    }
  ]
}]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
ipcMain.on('reqRead', (event, path) => {
  fs.readFile(path, 'utf8', (err, data) => {
    if (err) {
      dialog.showErrorBox('警告', '文件不能打开')
    } else {
      let mes = {}
      mes.allname = path
      mes.name = path.split('\\').slice(-1)[0]
      mes.data = data
      mainWindow.webContents.send('sendmes', mes)
    }
  })
})
ipcMain.on('writefile', (event, mess) => {
  if (mess) {
    if (mess.path === '') {
      let filename = dialog.showSaveDialog({
        securityScopedBookmarks: true
      })
      fs.writeFileSync(filename, mess.data)
      mainWindow.webContents.send('changemes', filename)
    } else {
      fs.writeFileSync(mess.path, mess.data)
    }
  }
})
ipcMain.on('markdownTransform', (event, mess) => {
  if (mess) {
    let htmlmess = markdown.markdown.toHTML(mess)
    mainWindow.webContents.send('getHtml', htmlmess)
  }
})
