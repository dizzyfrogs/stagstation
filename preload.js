const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectJsonFile: () => ipcRenderer.invoke('select-json-file'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  saveFile: (defaultPath) => ipcRenderer.invoke('save-file', defaultPath),
  convertSave: (options) => ipcRenderer.invoke('convert-save', options),
  detectSaveType: (filePath) => ipcRenderer.invoke('detect-save-type', filePath),
  detectSaveFiles: (options) => ipcRenderer.invoke('detect-save-files', options),
  readSettings: () => ipcRenderer.invoke('read-settings'),
  writeSettings: (settings) => ipcRenderer.invoke('write-settings', settings),
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  // Cloud sync APIs
  cloudConnect: (credentialsPath) => ipcRenderer.invoke('cloud-connect', credentialsPath),
  cloudCompleteAuth: (credentialsPath) => ipcRenderer.invoke('cloud-complete-auth', credentialsPath),
  cloudListSaves: (game) => ipcRenderer.invoke('cloud-list-saves', game),
  cloudCompareSlot: (game, slotNumber, localPath) => ipcRenderer.invoke('cloud-compare-slot', game, slotNumber, localPath),
  cloudUploadSlot: (game, slotNumber, localPath, saveName, createBackup) => ipcRenderer.invoke('cloud-upload-slot', game, slotNumber, localPath, saveName, createBackup),
  cloudDownloadSlot: (game, slotNumber, localPath, saveId, fileId, entryName, createBackup) => ipcRenderer.invoke('cloud-download-slot', game, slotNumber, localPath, saveId, fileId, entryName, createBackup),
  cloudSyncAll: (game, createBackup) => ipcRenderer.invoke('cloud-sync-all', game, createBackup),
  getDefaultSavePath: (game) => ipcRenderer.invoke('get-default-save-path', game),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  // Editor APIs
  readSaveFile: (filePath) => ipcRenderer.invoke('read-save-file', filePath),
  writeSaveFile: (options) => ipcRenderer.invoke('write-save-file', options)
});

