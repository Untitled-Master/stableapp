const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  electron: process.versions.electron,
  chrome: process.versions.chrome,
  node: process.versions.node,
})

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
})

contextBridge.exposeInMainWorld('stableApp', {
  detectLocalStack: () => ipcRenderer.invoke('system:detect-local-stack'),
  openXampp: () => ipcRenderer.invoke('system:open-xampp'),
  getManagedDatabaseStatus: () => ipcRenderer.invoke('database:managed-status'),
  setupManagedDatabase: () => ipcRenderer.invoke('database:setup-managed'),
  startManagedDatabase: () => ipcRenderer.invoke('database:start-managed'),
  connectDatabase: (config) => ipcRenderer.invoke('database:connect', config),
  listTables: (database) => ipcRenderer.invoke('database:list-tables', database),
  getSchema: (database) => ipcRenderer.invoke('database:get-schema', database),
  selectDatabase: (database) => ipcRenderer.invoke('database:select-database', database),
  runQuery: (sql) => ipcRenderer.invoke('database:query', sql),
  disconnectDatabase: () => ipcRenderer.invoke('database:disconnect'),
  onDatabaseSetupProgress: (callback) => {
    const listener = (_event, progress) => callback(progress)
    ipcRenderer.on('database:setup-progress', listener)
    return () => ipcRenderer.removeListener('database:setup-progress', listener)
  },
})
