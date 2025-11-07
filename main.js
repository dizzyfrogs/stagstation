const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1140,
    height: 850,
    resizable: false,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f0f1a',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// disable dev tools shortcuts
app.on('browser-window-created', (event, window) => {
  window.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      event.preventDefault();
    }
    if (input.key === 'F12') {
      event.preventDefault();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Save Files', extensions: ['dat'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (!result.canceled && result.directoryPaths.length > 0) {
    return result.directoryPaths[0];
  }
  return null;
});

ipcMain.handle('save-file', async (event, defaultPath) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultPath,
    filters: [
      { name: 'Save Files', extensions: ['dat'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled) {
    return result.filePath;
  }
  return null;
});

const { pcToSwitch, switchToPc } = require('./converter.js');

// gets the default save path for hollow knight based on OS
function getHollowKnightSavePath() {
  const platform = process.platform;
  const homeDir = os.homedir();
  
  if (platform === 'win32') {
    return path.join(homeDir, 'AppData', 'LocalLow', 'Team Cherry', 'Hollow Knight');
  } else if (platform === 'darwin') {
    return path.join(homeDir, 'Library', 'Application Support', 'unity.Team Cherry.Hollow Knight');
  } else if (platform === 'linux') {
    return path.join(homeDir, '.config', 'unity3d', 'Team Cherry', 'Hollow Knight');
  } else {
    return path.join(homeDir, 'AppData', 'LocalLow', 'Team Cherry', 'Hollow Knight');
  }
}

// gets the default save path for silksong based on OS
function getSilksongSavePath() {
  const platform = process.platform;
  const homeDir = os.homedir();
  
  if (platform === 'win32') {
    return path.join(homeDir, 'AppData', 'LocalLow', 'Team Cherry', 'Hollow Knight Silksong');
  } else if (platform === 'darwin') {
    return path.join(homeDir, 'Library', 'Application Support', 'unity.Team-Cherry.Silksong');
  } else if (platform === 'linux') {
    return path.join(homeDir, '.config', 'unity3d', 'Team Cherry', 'Hollow Knight Silksong');
  } else {
    return path.join(homeDir, 'AppData', 'LocalLow', 'Team Cherry', 'Hollow Knight Silksong');
  }
}

ipcMain.handle('convert-save', async (event, { game, direction, inputPath, outputPath }) => {
  try {
    let success = false;
    
    if (direction === 'pc-to-switch') {
      success = await pcToSwitch(inputPath, outputPath);
    } else if (direction === 'switch-to-pc') {
      success = await switchToPc(inputPath, outputPath);
    } else {
      throw new Error(`Unknown direction: ${direction}`);
    }
    
    if (success) {
      return { success: true, message: 'Conversion successful!' };
    } else {
      throw new Error('Conversion failed');
    }
  } catch (error) {
    throw new Error(`Conversion failed: ${error.message}`);
  }
});

ipcMain.handle('detect-save-files', async (event, { game, platform, basePath }) => {
  try {
    let searchPath = basePath;
    
    if (!basePath || basePath === '') {
      if (platform === 'pc') {
        if (game === 'hollowknight') {
          searchPath = getHollowKnightSavePath();
        } else if (game === 'silksong') {
          // silksong sometimes has a userid subfolder, gotta find it
          const silksongBase = getSilksongSavePath();
          try {
            const items = await fs.readdir(silksongBase);
            for (const item of items) {
              const itemPath = path.join(silksongBase, item);
              try {
                const itemStats = await fs.stat(itemPath);
                if (itemStats.isDirectory()) {
                  const subItems = await fs.readdir(itemPath);
                  const hasDatFiles = subItems.some(file => file.endsWith('.dat'));
                  if (hasDatFiles) {
                    searchPath = itemPath;
                    break;
                  }
                }
              } catch {
                // keep looking
              }
            }
            if (searchPath === basePath) {
              searchPath = silksongBase;
            }
          } catch {
            searchPath = silksongBase;
          }
        }
      }
    } else {
      // check if we need to go into a subdirectory for silksong
      if (platform === 'pc' && game === 'silksong') {
        try {
          const stats = await fs.stat(searchPath);
          if (stats.isDirectory()) {
            const items = await fs.readdir(searchPath);
            const hasDatFilesHere = items.some(file => file.endsWith('.dat'));
            
            if (!hasDatFilesHere) {
              for (const item of items) {
                const itemPath = path.join(searchPath, item);
                try {
                  const itemStats = await fs.stat(itemPath);
                  if (itemStats.isDirectory()) {
                    const subItems = await fs.readdir(itemPath);
                    const hasDatFiles = subItems.some(file => file.endsWith('.dat'));
                    if (hasDatFiles) {
                      searchPath = itemPath;
                      break;
                    }
                  }
                } catch {
                  // keep looking
                }
              }
            }
          }
        } catch {
          // use original path if we can't read it
        }
      }
    }
    
    const files = await fs.readdir(searchPath);
    // only show actual save files, skip backups
    const saveFiles = files.filter(file => {
      const regularSavePattern = /^user\d+\.dat$/i;
      return regularSavePattern.test(file);
    });
    
    const filesWithStats = await Promise.all(
      saveFiles.map(async (file) => {
        const filePath = path.join(searchPath, file);
        try {
          const stats = await fs.stat(filePath);
          const slotMatch = file.match(/^user(\d+)\.dat$/i);
          const slotNumber = slotMatch ? parseInt(slotMatch[1]) : null;
          
          return {
            filename: file,
            slotNumber: slotNumber,
            modifiedDate: stats.mtime,
            path: filePath
          };
        } catch (error) {
          const slotMatch = file.match(/^user(\d+)\.dat$/i);
          const slotNumber = slotMatch ? parseInt(slotMatch[1]) : null;
          return {
            filename: file,
            slotNumber: slotNumber,
            modifiedDate: null,
            path: filePath
          };
        }
      })
    );
    
    filesWithStats.sort((a, b) => {
      if (a.slotNumber === null) return 1;
      if (b.slotNumber === null) return -1;
      return a.slotNumber - b.slotNumber;
    });
    
    return { success: true, files: filesWithStats, path: searchPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-settings', async () => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    const data = await fs.readFile(settingsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {
      pcSavePath: '',
      switchJKSVPath: ''
    };
  }
});

ipcMain.handle('write-settings', async (event, settings) => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// window controls
ipcMain.handle('window-minimize', () => {
  mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('window-close', () => {
  mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow.isMaximized();
});

