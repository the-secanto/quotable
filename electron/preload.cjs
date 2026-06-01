const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ping: () => ipcRenderer.invoke('ping'),
  getQuotes: () => ipcRenderer.invoke('get-quotes'),
  addQuote: (quote) => ipcRenderer.invoke('add-quote', quote),
  updateQuote: (id, patch) => ipcRenderer.invoke('update-quote', id, patch),
  deleteQuote: (id) => ipcRenderer.invoke('delete-quote', id),
  getRules: () => ipcRenderer.invoke('get-rules'),
  addRule: (rule) => ipcRenderer.invoke('add-rule', rule),
  updateRule: (id, patch) => ipcRenderer.invoke('update-rule', id, patch),
  deleteRule: (id) => ipcRenderer.invoke('delete-rule', id),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSetting: (key, value) => ipcRenderer.invoke('update-setting', key, value),
  triggerOverlay: () => ipcRenderer.invoke('trigger-overlay'),
  closeOverlay: () => ipcRenderer.invoke('close-overlay'),
  exportQuotes: () => ipcRenderer.invoke('export-quotes'),
  importQuotes: () => ipcRenderer.invoke('import-quotes'),
  getDeletedRecords: () => ipcRenderer.invoke('get-deleted-records'),
  removeDeletedRecord: (id) => ipcRenderer.invoke('remove-deleted-record', id),
  onDisplayQuote: (callback) => ipcRenderer.on('display-quote', (_event, value) => callback(value)),
  onNavigateTo: (callback) => ipcRenderer.on('navigate-to', (_event, value) => callback(value)),
  onSettingUpdated: (callback) => ipcRenderer.on('setting-updated', (_event, value) => callback(value)),
});
