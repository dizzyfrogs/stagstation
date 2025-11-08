const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
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
    
    // for switch platform with SD card path, also check for .zip files
    let saveFiles = [];
    if (platform === 'switch' && basePath && basePath !== '') {
      // check for both .dat files and .zip files
      saveFiles = files.filter(file => {
        const regularSavePattern = /^user\d+\.dat$/i;
        const zipPattern = /\.zip$/i;
        return regularSavePattern.test(file) || zipPattern.test(file);
      });
    } else {
      // only show actual save files, skip backups
      saveFiles = files.filter(file => {
        const regularSavePattern = /^user\d+\.dat$/i;
        return regularSavePattern.test(file);
      });
    }
    
    const filesWithStats = await Promise.all(
      saveFiles.map(async (file) => {
        const filePath = path.join(searchPath, file);
        try {
          const stats = await fs.stat(filePath);
          const slotMatch = file.match(/^user(\d+)\.dat$/i);
          const slotNumber = slotMatch ? parseInt(slotMatch[1]) : null;
          const isZip = /\.zip$/i.test(file);
          
          return {
            filename: file,
            slotNumber: slotNumber,
            modifiedDate: stats.mtime,
            path: filePath,
            isZip: isZip
          };
        } catch (error) {
          const slotMatch = file.match(/^user(\d+)\.dat$/i);
          const slotNumber = slotMatch ? parseInt(slotMatch[1]) : null;
          const isZip = /\.zip$/i.test(file);
          return {
            filename: file,
            slotNumber: slotNumber,
            modifiedDate: null,
            path: filePath,
            isZip: isZip
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
    const settings = JSON.parse(data);
    // make sure cloud sync settings exist
    if (!settings.cloudSync) {
      settings.cloudSync = {
        enabled: false,
        provider: 'google',
        createBackups: true,
        backupPath: '',
        metaFile: {
          enabled: true,
          mode: 'auto',
          customPath: ''
        },
        googleDrive: {
          credentialsPath: '',
          folderId: ''
        }
      };
    } else if (!settings.cloudSync.metaFile) {
      // add metaFile defaults if missing
      settings.cloudSync.metaFile = {
        enabled: true,
        mode: 'auto',
        customPath: ''
      };
    }
    return settings;
  } catch (error) {
    return {
      pcSavePath: '',
      switchJKSVPath: '',
      cloudSync: {
        enabled: false,
        provider: 'google',
        createBackups: true,
        backupPath: '',
        metaFile: {
          enabled: true,
          mode: 'auto',
          customPath: ''
        },
        googleDrive: {
          credentialsPath: '',
          folderId: ''
        }
      }
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

// cloud sync handlers
const { CloudSyncService } = require('./cloud-sync.js');
let cloudSyncService = null;

async function readSettingsSync() {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    const data = await fs.readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(data);
    if (!settings.cloudSync) {
      settings.cloudSync = {
        enabled: false,
        provider: 'google',
        createBackups: true,
        backupPath: '',
        metaFile: {
          enabled: true,
          mode: 'auto',
          customPath: ''
        },
        googleDrive: {
          credentialsPath: '',
          folderId: ''
        }
      };
    } else if (!settings.cloudSync.metaFile) {
      // add metaFile defaults if missing
      settings.cloudSync.metaFile = {
        enabled: true,
        mode: 'auto',
        customPath: ''
      };
    }
    return settings;
  } catch (error) {
    return {
      pcSavePath: '',
      switchJKSVPath: '',
      cloudSync: {
        enabled: false,
        provider: 'google',
        createBackups: true,
        googleDrive: {
          credentialsPath: '',
          folderId: '',
          userName: ''
        }
      }
    };
  }
}

ipcMain.handle('cloud-connect', async (event, credentialsPath) => {
  try {
    const settings = await readSettingsSync();
    cloudSyncService = new CloudSyncService(settings);
    const result = await cloudSyncService.authenticate(credentialsPath);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cloud-complete-auth', async (event, credentialsPath) => {
  try {
    if (!cloudSyncService || !cloudSyncService.pendingOAuthClient || !cloudSyncService.deviceCode) {
      return { success: false, error: 'Authentication not initiated. Please connect first.' };
    }
    
    const result = await cloudSyncService.completeAuth(credentialsPath);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cloud-list-saves', async (event, game) => {
  try {
    if (!cloudSyncService || !cloudSyncService.authenticated) {
      return { success: false, error: 'Not authenticated with Google Drive' };
    }
    const saves = await cloudSyncService.listSaves(game);
    return { success: true, saves: saves };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cloud-compare-slot', async (event, game, slotNumber, localPath) => {
  try {
    if (!cloudSyncService || !cloudSyncService.authenticated) {
      return { success: false, error: 'Not authenticated with Google Drive' };
    }
    const comparison = await cloudSyncService.compareSlot(game, slotNumber, localPath);
    return { success: true, comparison: comparison };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cloud-upload-slot', async (event, game, slotNumber, localPath, saveName, createBackup) => {
  try {
    if (!cloudSyncService || !cloudSyncService.authenticated) {
      return { success: false, error: 'Not authenticated with Google Drive' };
    }

    const settings = await readSettingsSync();
    const backupDir = settings.cloudSync?.backupPath || path.join(app.getPath('userData'), 'backups', game);

    // create backup if enabled
    if (createBackup && settings.cloudSync.createBackups) {
      await cloudSyncService.createBackup(localPath, backupDir);
    }

    // convert PC to switch format
    const tempSwitchPath = path.join(os.tmpdir(), `stagstation_${Date.now()}_user${slotNumber}.dat`);
    await pcToSwitch(localPath, tempSwitchPath);

    // upload to cloud, create new zip file with timestamp
    const gameName = game === 'hollowknight' ? 'Hollow Knight' : 'Hollow Knight Silksong';
    const gameFolderId = await cloudSyncService.findGameFolder(gameName);
    const AdmZip = require('adm-zip');

    // generate timestamp in format: YYYY-MM-DD_hh-mm-ss
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    const zipFileName = `${saveName}.zip`;

    // create new zip file
    const zip = new AdmZip();
    zip.addFile(`user${slotNumber}.dat`, await fs.readFile(tempSwitchPath));

    // handle .nx_save_meta.bin file if enabled
    const metaFileSettings = settings.cloudSync?.metaFile;
    if (metaFileSettings?.enabled) {
      let metaFilePath = null;
      
      if (metaFileSettings.mode === 'custom' && metaFileSettings.customPath) {
        // use custom meta file path
        if (await cloudSyncService.fileExists(metaFileSettings.customPath)) {
          metaFilePath = metaFileSettings.customPath;
        }
      } else if (metaFileSettings.mode === 'auto') {
        // find most recent meta file from cloud saves
        try {
          const saves = await cloudSyncService.listSaves(game);
          const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          for (const save of saves) {
            const tempZipPath = path.join(os.tmpdir(), `stagstation_meta_${uniqueId}_${save.zipFileName}`);
            try {
              await cloudSyncService.downloadSaveFile(save.id, tempZipPath);
              const tempZip = new AdmZip(tempZipPath);
              const metaEntry = tempZip.getEntry('.nx_save_meta.bin');
              if (metaEntry && !metaEntry.isDirectory) {
                // extract meta file to temp location
                const tempMetaPath = path.join(os.tmpdir(), `stagstation_meta_${uniqueId}.bin`);
                tempZip.extractEntryTo(metaEntry, os.tmpdir(), false, true);
                const extractedPath = path.join(os.tmpdir(), '.nx_save_meta.bin');
                if (await cloudSyncService.fileExists(extractedPath)) {
                  await fs.rename(extractedPath, tempMetaPath);
                  metaFilePath = tempMetaPath;
                }
                await fs.unlink(tempZipPath).catch(() => {});
                break; // use found
              }
              await fs.unlink(tempZipPath).catch(() => {});
            } catch (error) {
              await fs.unlink(tempZipPath).catch(() => {});
              // continue to next save
            }
          }
        } catch (error) {
          console.warn(`Failed to find meta file from cloud saves: ${error.message}`);
        }
      }
      
      if (metaFilePath) {
        zip.addFile('.nx_save_meta.bin', await fs.readFile(metaFilePath));
        // clean up temp meta file if it was extracted
        if (metaFilePath.includes('stagstation_meta_')) {
          await fs.unlink(metaFilePath).catch(() => {});
        }
      }
    }

    const zipFilePath = path.join(os.tmpdir(), `stagstation_${Date.now()}_${zipFileName}`);
    zip.writeZip(zipFilePath);

    // upload new zip file
    const uploadedFile = await cloudSyncService.uploadFile(zipFilePath, zipFileName, gameFolderId);

    // update local file timestamp to match cloud timestamp
    // this prevents the "cloud-newer" false positive after upload
    await cloudSyncService.updateLocalFileTimestamp(localPath, uploadedFile.modifiedTime);

    // clean up temp files
    await fs.unlink(tempSwitchPath).catch(() => {});
    await fs.unlink(zipFilePath).catch(() => {});

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cloud-download-slot', async (event, game, slotNumber, localPath, saveId, fileId, entryName, createBackup) => {
  try {
    if (!cloudSyncService || !cloudSyncService.authenticated) {
      return { success: false, error: 'Not authenticated with Google Drive' };
    }

    const settings = await readSettingsSync();
    const backupDir = settings.cloudSync?.backupPath || path.join(app.getPath('userData'), 'backups', game);
    const AdmZip = require('adm-zip');

    // create backup if enabled and file exists
    if (createBackup && settings.cloudSync.createBackups && await cloudSyncService.fileExists(localPath)) {
      await cloudSyncService.createBackup(localPath, backupDir);
    }

    // download zip file from cloud
    const tempZipPath = path.join(os.tmpdir(), `stagstation_${Date.now()}_save.zip`);
    await cloudSyncService.downloadSaveFile(fileId, tempZipPath);

    // extract the specific slot from zip
    const zip = new AdmZip(tempZipPath);
    const entry = zip.getEntry(entryName || `user${slotNumber}.dat`);
    
    if (!entry) {
      await fs.unlink(tempZipPath).catch(() => {});
      return { success: false, error: `Slot ${slotNumber} not found in zip file` };
    }

    const tempSwitchPath = path.join(os.tmpdir(), `stagstation_${Date.now()}_user${slotNumber}.dat`);
    zip.extractEntryTo(entry, os.tmpdir(), false, true);
    
    // move extracted file to temp path
    const extractedPath = path.join(os.tmpdir(), entryName || `user${slotNumber}.dat`);
    await fs.rename(extractedPath, tempSwitchPath);

    // convert switch to PC format
    await switchToPc(tempSwitchPath, localPath);

    // clean up temp files
    await fs.unlink(tempZipPath).catch(() => {});
    await fs.unlink(tempSwitchPath).catch(() => {});

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-default-save-path', async (event, game) => {
  try {
    if (game === 'hollowknight') {
      return { success: true, path: getHollowKnightSavePath() };
    } else if (game === 'silksong') {
      return { success: true, path: getSilksongSavePath() };
    }
    return { success: false, error: 'Unknown game' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-external-url', async (event, url) => {
  await shell.openExternal(url);
});

ipcMain.handle('cloud-sync-all', async (event, game, createBackup) => {
  try {
    if (!cloudSyncService || !cloudSyncService.authenticated) {
      return { success: false, error: 'Not authenticated with Google Drive' };
    }

    const settings = await readSettingsSync();
    let pcPath = settings.pcSavePath;
    if (!pcPath) {
      // use default path based on game
      if (game === 'hollowknight') {
        pcPath = getHollowKnightSavePath();
      } else if (game === 'silksong') {
        pcPath = getSilksongSavePath();
      } else {
        pcPath = getHollowKnightSavePath();
      }
    }
    
    // compare all slots (1-4 typically)
    const comparisons = [];
    for (let slot = 1; slot <= 4; slot++) {
      const localPath = path.join(pcPath, `user${slot}.dat`);
      const comparison = await cloudSyncService.compareSlot(game, slot, localPath);
      comparisons.push({
        slot: slot,
        ...comparison
      });
    }

    return { success: true, comparisons: comparisons };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

