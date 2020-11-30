const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'assets', 'ico', 'lottery.png'),
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadFile('index.html')
  //mainWindow.webContents.openDevTools()
  mainWindow.setMenuBarVisibility(false)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control) {
      switch (input.key.toLowerCase()) {
        case 'f':
          mainWindow.setFullScreen(!mainWindow.isFullScreen())
          break
        case 'f12':
          mainWindow.webContents.openDevTools()
          break
      }
    }
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})