const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

let mainWindow;

function createWindow() {
  // Cross-platform icon handling
  let iconPath;
  const platform = process.platform;
  if (platform === 'win32') {
    iconPath = path.join(__dirname, 'assets', 'icon.ico');
  } else if (platform === 'darwin') {
    iconPath = path.join(__dirname, 'assets', 'icon.icns');
  } else {
    // Linux and other platforms
    iconPath = path.join(__dirname, 'assets', 'icon.png');
  }
  
  // Check if icon exists, otherwise use default
  const iconExists = require('fs').existsSync(iconPath);
  
  mainWindow = new BrowserWindow({
    width: 1140,
    height: 850,
    resizable: true,
    maximizable: true,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f0f1a',
    ...(iconExists && { icon: iconPath }),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: true
    }
  });

  // dev mode uses vite server, prod uses built files
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// dev tools stuff
app.on('browser-window-created', (event, window) => {
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    return;
  }
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

// ipc stuff
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

ipcMain.handle('select-json-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
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

const { pcToSwitch, switchToPc, detectSaveType, readSaveFileAsJson, writeSaveFileFromJson } = require('./converter.js');

// get hollow knight save path based on OS
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

// get silksong save path based on OS
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

ipcMain.handle('detect-save-type', async (event, filePath) => {
  try {
    const result = await detectSaveType(filePath);
    return result;
  } catch (error) {
    return { type: 'unknown', error: error.message };
  }
});

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
                // skip this one
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
      // silksong might need to go one folder deeper
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
                  // skip this one
                }
              }
            }
          }
        } catch {
          // fallback to original path
        }
      }
    }
    
    const files = await fs.readdir(searchPath);
    
    // switch platform might have .zip files too
    let saveFiles = [];
    if (platform === 'switch' && basePath && basePath !== '') {
      // look for both .dat and .zip
      saveFiles = files.filter(file => {
        const regularSavePattern = /^user\d+\.dat$/i;
        const zipPattern = /\.zip$/i;
        return regularSavePattern.test(file) || zipPattern.test(file);
      });
    } else {
      // only actual saves, skip backups
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
    // ensure cloud sync settings exist
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
      // add metaFile defaults
      settings.cloudSync.metaFile = {
        enabled: true,
        mode: 'auto',
        customPath: ''
      };
    }
    // ensure editorAutoBackup exists
    if (settings.editorAutoBackup === undefined) {
      settings.editorAutoBackup = true;
    }
    // ensure editorBackupPath exists
    if (settings.editorBackupPath === undefined) {
      settings.editorBackupPath = '';
    }
    // ensure defaultPage exists
    if (!settings.defaultPage) {
      settings.defaultPage = 'editor';
    }
    return settings;
  } catch (error) {
    return {
      pcSavePath: '',
      switchJKSVPath: '',
      defaultPage: 'editor',
      editorAutoBackup: true,
      editorBackupPath: '',
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

// window button handlers
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

// cloud sync stuff
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
      // add metaFile defaults
      settings.cloudSync.metaFile = {
        enabled: true,
        mode: 'auto',
        customPath: ''
      };
    }
    // ensure editorAutoBackup exists
    if (settings.editorAutoBackup === undefined) {
      settings.editorAutoBackup = true;
    }
    // ensure editorBackupPath exists
    if (settings.editorBackupPath === undefined) {
      settings.editorBackupPath = '';
    }
    // ensure defaultPage exists
    if (!settings.defaultPage) {
      settings.defaultPage = 'editor';
    }
    return settings;
  } catch (error) {
    return {
      pcSavePath: '',
      switchJKSVPath: '',
      defaultPage: 'editor',
      editorAutoBackup: true,
      editorBackupPath: '',
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

    // backup if enabled
    if (createBackup && settings.cloudSync.createBackups) {
      await cloudSyncService.createBackup(localPath, backupDir);
    }

    // convert to switch format
    const tempSwitchPath = path.join(os.tmpdir(), `stagstation_${Date.now()}_user${slotNumber}.dat`);
    await pcToSwitch(localPath, tempSwitchPath);

    // upload to cloud with timestamp
    const gameName = game === 'hollowknight' ? 'Hollow Knight' : 'Hollow Knight Silksong';
    const gameFolderId = await cloudSyncService.findGameFolder(gameName);
    const AdmZip = require('adm-zip');

    // timestamp format: YYYY-MM-DD_hh-mm-ss
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    const zipFileName = `${saveName}.zip`;

    // make zip file
    const zip = new AdmZip();
    zip.addFile(`user${slotNumber}.dat`, await fs.readFile(tempSwitchPath));

    // handle meta file if enabled
    const metaFileSettings = settings.cloudSync?.metaFile;
    if (metaFileSettings?.enabled) {
      let metaFilePath = null;
      
      if (metaFileSettings.mode === 'custom' && metaFileSettings.customPath) {
        // use custom path
        if (await cloudSyncService.fileExists(metaFileSettings.customPath)) {
          metaFilePath = metaFileSettings.customPath;
        }
      } else if (metaFileSettings.mode === 'auto') {
        // find most recent meta file from cloud
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
                // extract to temp
                const tempMetaPath = path.join(os.tmpdir(), `stagstation_meta_${uniqueId}.bin`);
                tempZip.extractEntryTo(metaEntry, os.tmpdir(), false, true);
                const extractedPath = path.join(os.tmpdir(), '.nx_save_meta.bin');
                if (await cloudSyncService.fileExists(extractedPath)) {
                  await fs.rename(extractedPath, tempMetaPath);
                  metaFilePath = tempMetaPath;
                }
                await fs.unlink(tempZipPath).catch(() => {});
                break; // found it
              }
              await fs.unlink(tempZipPath).catch(() => {});
            } catch (error) {
              await fs.unlink(tempZipPath).catch(() => {});
              // try next save
            }
          }
        } catch (error) {
          console.warn(`Failed to find meta file from cloud saves: ${error.message}`);
        }
      }
      
      if (metaFilePath) {
        zip.addFile('.nx_save_meta.bin', await fs.readFile(metaFilePath));
        // cleanup temp meta file
        if (metaFilePath.includes('stagstation_meta_')) {
          await fs.unlink(metaFilePath).catch(() => {});
        }
      }
    }

    const zipFilePath = path.join(os.tmpdir(), `stagstation_${Date.now()}_${zipFileName}`);
    zip.writeZip(zipFilePath);

    // upload zip
    const uploadedFile = await cloudSyncService.uploadFile(zipFilePath, zipFileName, gameFolderId);

    // update local timestamp to match cloud so it doesn't show as "cloud-newer" after upload
    await cloudSyncService.updateLocalFileTimestamp(localPath, uploadedFile.modifiedTime);

    // cleanup temp files
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

    // backup if enabled and file exists
    if (createBackup && settings.cloudSync.createBackups && await cloudSyncService.fileExists(localPath)) {
      await cloudSyncService.createBackup(localPath, backupDir);
    }

    // download zip from cloud
    const tempZipPath = path.join(os.tmpdir(), `stagstation_${Date.now()}_save.zip`);
    await cloudSyncService.downloadSaveFile(fileId, tempZipPath);

    // extract the slot from zip
    const zip = new AdmZip(tempZipPath);
    const entry = zip.getEntry(entryName || `user${slotNumber}.dat`);
    
    if (!entry) {
      await fs.unlink(tempZipPath).catch(() => {});
      return { success: false, error: `Slot ${slotNumber} not found in zip file` };
    }

    const tempSwitchPath = path.join(os.tmpdir(), `stagstation_${Date.now()}_user${slotNumber}.dat`);
    zip.extractEntryTo(entry, os.tmpdir(), false, true);
    
    // move to temp path
    const extractedPath = path.join(os.tmpdir(), entryName || `user${slotNumber}.dat`);
    await fs.rename(extractedPath, tempSwitchPath);

    // convert to PC format
    await switchToPc(tempSwitchPath, localPath);

    // cleanup temp files
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
                return { success: true, path: itemPath };
              }
            }
          } catch {
            // keep looking
          }
        }
        // if no subfolder, check if .dat files are in base dir
        const baseItems = await fs.readdir(silksongBase);
        const hasDatFiles = baseItems.some(file => file.endsWith('.dat'));
        if (hasDatFiles) {
          return { success: true, path: silksongBase };
        }
        // default to base if nothing found
        return { success: true, path: silksongBase };
      } catch {
        return { success: true, path: silksongBase };
      }
    }
    return { success: false, error: 'Unknown game' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-external-url', async (event, url) => {
  await shell.openExternal(url);
});

ipcMain.handle('get-user-data-path', async () => {
  return { success: true, path: app.getPath('userData') };
});

// read save file as JSON
ipcMain.handle('read-save-file', async (event, filePath) => {
  try {
    const jsonData = await readSaveFileAsJson(filePath);
    return { success: true, data: jsonData };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// write save file from JSON
ipcMain.handle('write-save-file', async (event, { filePath, data, saveType, createBackup }) => {
  try {
    // create backup if requested (before writing)
    let backupPath = null;
    if (createBackup) {
      try {
        // check if file exists before backing up
        await fs.access(filePath);
        const settings = await readSettingsSync();
        const fileName = path.basename(filePath, path.extname(filePath));
        const fileExt = path.extname(filePath);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        
        // Use custom backup path if specified, otherwise use default (next to file or appdata)
        let backupDir;
        if (settings.editorBackupPath && settings.editorBackupPath.trim() !== '') {
          backupDir = settings.editorBackupPath;
        } else {
          // Default: next to the file
          backupDir = path.join(path.dirname(filePath), 'backups');
        }
        
        // ensure backup directory exists
        await fs.mkdir(backupDir, { recursive: true });
        
        backupPath = path.join(backupDir, `${fileName}_backup_${timestamp}${fileExt}`);
        await fs.copyFile(filePath, backupPath);
      } catch (backupError) {
        // if backup fails, log but don't fail the save
        console.warn('Failed to create backup:', backupError.message);
      }
    }
    
    // write the file
    await writeSaveFileFromJson(filePath, data, saveType);
    return { success: true, backupPath: backupPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cloud-sync-all', async (event, game, createBackup) => {
  try {
    if (!cloudSyncService || !cloudSyncService.authenticated) {
      return { success: false, error: 'Not authenticated with Google Drive' };
    }

    const settings = await readSettingsSync();
    let pcPath = settings.pcSavePath;
    if (!pcPath) {
      // use default path
      if (game === 'hollowknight') {
        pcPath = getHollowKnightSavePath();
      } else if (game === 'silksong') {
        pcPath = getSilksongSavePath();
      } else {
        pcPath = getHollowKnightSavePath();
      }
    }
    
    // compare all slots
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

