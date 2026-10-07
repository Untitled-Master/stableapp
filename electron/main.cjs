const path = require('node:path')
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const { createHash, randomBytes } = require('node:crypto')
const { app, BrowserWindow, ipcMain, safeStorage, shell } = require('electron')
const { Transform } = require('node:stream')
const { pipeline } = require('node:stream/promises')
const { Readable } = require('node:stream')
const { spawn, spawnSync } = require('node:child_process')
const { promisify } = require('node:util')
const net = require('node:net')
const mysql = require('mysql2/promise')
const yauzl = require('yauzl')
const execFileAsync = promisify(require('node:child_process').execFile)

const isDev = !app.isPackaged

function createWindow() {
  const iconPath = isDev
    ? path.join(__dirname, '..', 'public', 'Stable.png')
    : path.join(__dirname, '..', 'dist', 'Stable.png')
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    frame: false,
    titleBarStyle: 'hidden',
    ...(fs.existsSync(iconPath) ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  mainWindow = win

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

let mainWindow = null
let activeDatabaseConnection = null
let managedDatabaseProcess = null
let managedDatabaseLog = null
let managedSetupInProgress = false
const managedPortStart = 3307

function managedPaths() {
  const root = path.join(app.getPath('userData'), 'managed-database')
  return {
    root,
    engine: path.join(root, 'engine'),
    staging: path.join(root, 'engine-staging'),
    data: path.join(root, 'data'),
    archive: path.join(root, 'mysql.zip'),
    partialArchive: path.join(root, 'mysql.zip.part'),
    metadata: path.join(root, 'server.json'),
    secret: path.join(root, 'root-password.bin'),
    log: path.join(root, 'mysql.log'),
    initFile: path.join(root, 'initialize-root.sql'),
  }
}

function findCommand(command) {
  const locator = process.platform === 'win32' ? 'where.exe' : 'which'
  const result = spawnSync(locator, [command], {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 3000,
  })

  if (result.status !== 0) return null
  return result.stdout.trim().split(/\r?\n/)[0] || null
}

function getMysqlServices() {
  if (process.platform !== 'win32') return []
  const result = spawnSync('sc.exe', ['query', 'state=', 'all'], {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 5000,
  })
  if (result.status !== 0) return []

  return result.stdout.split(/SERVICE_NAME:\s*/i).slice(1).flatMap((block) => {
    const name = block.split(/\r?\n/, 1)[0]?.trim()
    if (!name || !/^mysql[a-z0-9_.-]{0,70}$/i.test(name)) return []
    const state = block.match(/STATE\s*:\s*(\d+)/i)?.[1]
    return [{ name, running: state === '4' }]
  })
}

function reportSetupProgress(stage, percent = null) {
  mainWindow?.webContents.send('database:setup-progress', { stage, percent })
}

function isInsideDirectory(root, target) {
  const relative = path.relative(root, target)
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
}

function extractZip(zipPath, destination) {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true, autoClose: false }, (openError, archive) => {
      if (openError) return reject(openError)
      let totalExpanded = 0
      let settled = false
      const fail = (error) => {
        if (settled) return
        settled = true
        archive.close()
        reject(error)
      }

      archive.on('error', fail)
      archive.on('end', () => {
        if (settled) return
        settled = true
        archive.close()
        resolve()
      })
      archive.on('entry', (entry) => {
        if (settled) return
        const entryName = entry.fileName.replace(/\\/g, '/')
        const pieces = entryName.split('/')
        const unixMode = (entry.externalFileAttributes >>> 16) & 0xF000
        if (
          entryName.startsWith('/')
          || /^[a-z]:/i.test(entryName)
          || pieces.includes('..')
          || unixMode === 0xA000
        ) {
          fail(new Error('The database archive contains an unsafe file path.'))
          return
        }

        const target = path.resolve(destination, ...pieces.filter(Boolean))
        if (!isInsideDirectory(destination, target)) {
          fail(new Error('The database archive contains a file outside its install folder.'))
          return
        }
        totalExpanded += entry.uncompressedSize || 0
        if (totalExpanded > 2 * 1024 * 1024 * 1024) {
          fail(new Error('The database archive is larger than expected.'))
          return
        }

        if (entryName.endsWith('/')) {
          try {
            fs.mkdirSync(target, { recursive: true })
            archive.readEntry()
          } catch (error) {
            fail(error)
          }
          return
        }

        try {
          fs.mkdirSync(path.dirname(target), { recursive: true })
          archive.openReadStream(entry, (streamError, input) => {
            if (streamError) return fail(streamError)
            pipeline(input, fs.createWriteStream(target, { flags: 'wx' }))
              .then(() => archive.readEntry())
              .catch(fail)
          })
        } catch (error) {
          fail(error)
        }
      })
      archive.readEntry()
    })
  })
}

async function findBinary(directory, filename, depth = 0) {
  if (depth > 4) return null
  const candidate = path.join(directory, 'bin', filename)
  if (fs.existsSync(candidate)) return candidate
  const entries = await fsp.readdir(directory, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const found = await findBinary(path.join(directory, entry.name), filename, depth + 1)
    if (found) return found
  }
  return null
}

async function fetchMysqlArchive() {
  reportSetupProgress('Preparing Oracle MySQL 8.4 LTS')
  return {
    release: '8.4.11',
    url: 'https://cdn.mysql.com/Downloads/MySQL-8.4/mysql-8.4.11-winx64.zip',
    md5: '2e833921898a9a030ea6bfe81bd811bc',
  }
}

async function downloadMysql(paths, packageInfo) {
  const response = await fetch(packageInfo.url, { signal: AbortSignal.timeout(20 * 60 * 1000) })
  if (!response.ok || !response.body) throw new Error(`MySQL download failed (${response.status}).`)
  if (!response.url.startsWith('https://')) throw new Error('The MySQL download did not use HTTPS.')
  await fsp.rm(paths.partialArchive, { force: true })
  const hash = createHash('md5')
  let received = 0
  const total = Number(response.headers.get('content-length')) || null
  const meter = new Transform({
    transform(chunk, _encoding, callback) {
      received += chunk.length
      if (received > 1024 * 1024 * 1024) return callback(new Error('The MySQL archive exceeded the expected 1 GB size limit.'))
      hash.update(chunk)
      if (total) reportSetupProgress('Downloading Oracle MySQL', Math.min(99, Math.round((received / total) * 100)))
      callback(null, chunk)
    },
  })
  try {
    await pipeline(Readable.fromWeb(response.body), meter, fs.createWriteStream(paths.partialArchive, { flags: 'wx' }))
    if (hash.digest('hex') !== packageInfo.md5) throw new Error('MySQL archive checksum verification failed; the file was discarded.')
    await fsp.rename(paths.partialArchive, paths.archive)
  } catch (error) {
    await fsp.rm(paths.partialArchive, { force: true })
    throw error
  }
}

async function getAvailablePort(startAt = managedPortStart) {
  for (let port = startAt; port < startAt + 100; port += 1) {
    const available = await new Promise((resolve) => {
      const server = net.createServer()
      server.once('error', () => resolve(false))
      server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)))
    })
    if (available) return port
  }
  throw new Error('No free local database port was found in the 3307â€“3406 range.')
}

async function readManagedConfig(paths) {
  try {
    return JSON.parse(await fsp.readFile(paths.metadata, 'utf8'))
  } catch {
    return null
  }
}

async function getManagedPassword(paths) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Windows secure storage is unavailable, so StableApp cannot safely store its local database password.')
  }
  const encrypted = await fsp.readFile(paths.secret)
  return safeStorage.decryptString(encrypted)
}

async function connectToManagedDatabase(port, password) {
  const connection = await mysql.createConnection({
    host: '127.0.0.1', port, user: 'root', password,
    connectTimeout: 2000, multipleStatements: true,
  })
  try {
    const [versionRows] = await connection.query('SELECT VERSION() AS version')
    const [rows] = await connection.query('SHOW DATABASES')
    activeDatabaseConnection?.destroy()
    activeDatabaseConnection = connection
    return { ok: true, managed: true, host: '127.0.0.1', port,
      version: versionRows[0]?.version || 'MySQL', databases: rows.map((row) => row.Database) }
  } catch (error) {
    connection.destroy()
    throw error
  }
}

function runMysqlCommand(binary, args, timeout = 180000) {
  return execFileAsync(binary, args, {
    cwd: path.dirname(binary), windowsHide: true, timeout,
    maxBuffer: 4 * 1024 * 1024,
  })
}

async function startManagedDatabase() {
  if (process.platform !== 'win32') return { ok: false, error: 'The private MySQL server is currently supported on Windows.' }
  const paths = managedPaths()
  const config = await readManagedConfig(paths)
  if (!config || !fs.existsSync(paths.secret) || !fs.existsSync(paths.data)) {
    return { ok: false, error: 'Set up StableApp’s private MySQL server first.' }
  }
  const serverBinary = await findBinary(paths.engine, 'mysqld.exe')
  if (!serverBinary) return { ok: false, error: 'The private MySQL server files are missing. Run setup again.' }
  const password = await getManagedPassword(paths)
  try {
    return await connectToManagedDatabase(config.port, password)
  } catch (error) {
    if (error.code !== 'ECONNREFUSED') {
      const fallbackPort = await getAvailablePort(managedPortStart)
      if (fallbackPort === config.port) throw error
      config.port = fallbackPort
      await fsp.writeFile(paths.metadata, JSON.stringify(config, null, 2))
    }
  }

  reportSetupProgress('Starting StableApp’s private MySQL server')
  const errorLog = fs.createWriteStream(paths.log, { flags: 'a' })
  const basedir = path.dirname(path.dirname(serverBinary))
  const args = [
    '--no-defaults', `--basedir=${basedir}`, `--datadir=${paths.data}`,
    '--bind-address=127.0.0.1', `--port=${config.port}`, '--console',
  ]
  if (!config.initialized) {
    const initSql = `ALTER USER 'root'@'localhost' IDENTIFIED BY '${password}';\n`
    await fsp.writeFile(paths.initFile, initSql, { mode: 0o600 })
    args.push(`--init-file=${paths.initFile}`)
  }
  const processHandle = spawn(serverBinary, args, {
    cwd: basedir, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  })
  managedDatabaseProcess = processHandle
  managedDatabaseLog = errorLog
  processHandle.stdout.pipe(errorLog, { end: false })
  processHandle.stderr.pipe(errorLog, { end: false })
  processHandle.once('exit', () => {
    if (managedDatabaseProcess === processHandle) managedDatabaseProcess = null
    if (managedDatabaseLog === errorLog) { managedDatabaseLog = null; errorLog.end() }
  })
  processHandle.once('error', () => { if (managedDatabaseProcess === processHandle) managedDatabaseProcess = null })

  for (let attempt = 0; attempt < 90; attempt += 1) {
    if (processHandle.exitCode !== null) break
    try {
      const result = await connectToManagedDatabase(config.port, password)
      if (!config.initialized) {
        config.initialized = true
        await fsp.writeFile(paths.metadata, JSON.stringify(config, null, 2), { mode: 0o600 })
        await fsp.rm(paths.initFile, { force: true })
      }
      return result
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
  const logTail = await fsp.readFile(paths.log, 'utf8').catch(() => '')
  return { ok: false, error: `StableApp’s private MySQL server did not start. See its log at ${paths.log}${logTail ? `\n${logTail.slice(-1200)}` : ''}` }
}

async function setupManagedDatabase() {
  if (managedSetupInProgress) return { ok: false, error: 'Database setup is already running.' }
  if (process.platform !== 'win32') return { ok: false, error: 'The private MySQL server is currently supported on Windows.' }
  managedSetupInProgress = true
  const paths = managedPaths()
  try {
    if (await readManagedConfig(paths)) return startManagedDatabase()
    if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows secure storage is unavailable, so StableApp cannot safely store its local MySQL password.')
    await fsp.mkdir(paths.root, { recursive: true })
    const packageInfo = await fetchMysqlArchive()
    let serverBinary = await findBinary(paths.engine, 'mysqld.exe')
    if (!serverBinary) {
      reportSetupProgress('Downloading Oracle MySQL 8.4.11')
      await downloadMysql(paths, packageInfo)
      reportSetupProgress('Extracting the verified MySQL archive')
      await fsp.rm(paths.staging, { recursive: true, force: true })
      await fsp.mkdir(paths.staging, { recursive: true })
      await extractZip(paths.archive, paths.staging)
      const extractedServer = await findBinary(paths.staging, 'mysqld.exe')
      if (!extractedServer) throw new Error('The MySQL archive did not contain mysqld.exe.')
      await fsp.rm(paths.engine, { recursive: true, force: true })
      await fsp.rename(paths.staging, paths.engine)
      serverBinary = await findBinary(paths.engine, 'mysqld.exe')
    }
    const port = await getAvailablePort()
    const password = randomBytes(32).toString('hex')
    await fsp.rm(paths.data, { recursive: true, force: true })
    await fsp.mkdir(paths.data, { recursive: true })
    reportSetupProgress('Initializing the private MySQL data directory')
    try {
      await runMysqlCommand(serverBinary, [
        '--no-defaults', '--initialize-insecure', `--basedir=${path.dirname(path.dirname(serverBinary))}`,
        `--datadir=${paths.data}`,
      ])
    } catch (error) {
      await fsp.rm(paths.data, { recursive: true, force: true })
      throw new Error((error.stderr || error.stdout || error.message || 'MySQL could not initialize its private data directory.').slice(-1600))
    }
    await fsp.writeFile(paths.secret, safeStorage.encryptString(password), { mode: 0o600 })
    await fsp.writeFile(paths.metadata, JSON.stringify({ version: packageInfo.release, port, initialized: false }, null, 2), { mode: 0o600 })
    await fsp.rm(paths.archive, { force: true })
    reportSetupProgress('Starting the private MySQL server')
    return startManagedDatabase()
  } catch (error) {
    return { ok: false, error: error.message || 'Could not set up the private MySQL server.' }
  } finally {
    managedSetupInProgress = false
  }
}

function probePort(host, port, timeout = 1500) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout }, () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => {
      socket.destroy()
      resolve(false)
    })
  })
}

async function detectLocalStack() {
  const drive = process.env.SystemDrive || 'C:'
  const xamppRoot = process.platform === 'win32'
    ? [path.join(drive, 'xampp'), path.join(drive, 'Program Files', 'xampp')].find(fs.existsSync) || null
    : null
  const xamppMysql = xamppRoot && path.basename(xamppRoot).toLowerCase() === 'xampp'
    ? path.join(xamppRoot, 'mysql', 'bin', process.platform === 'win32' ? 'mysql.exe' : 'mysql')
    : null
  const xamppPhp = xamppRoot && path.basename(xamppRoot).toLowerCase() === 'xampp'
    ? path.join(xamppRoot, 'php', process.platform === 'win32' ? 'php.exe' : 'php')
    : null
  const xamppApache = xamppRoot && path.basename(xamppRoot).toLowerCase() === 'xampp'
    ? path.join(xamppRoot, 'apache', 'bin', process.platform === 'win32' ? 'httpd.exe' : 'httpd')
    : null
  const mysql = findCommand('mysql') || (xamppMysql && fs.existsSync(xamppMysql) ? xamppMysql : null)
  const php = findCommand('php') || (xamppPhp && fs.existsSync(xamppPhp) ? xamppPhp : null)
  const apache = findCommand(process.platform === 'win32' ? 'httpd' : 'apache2')
    || (xamppApache && fs.existsSync(xamppApache) ? xamppApache : null)
  const mysqlServices = getMysqlServices()
  const mysqlService = mysqlServices.find((service) => service.running) || mysqlServices[0] || null
  const mysqlReachable = await probePort('127.0.0.1', 3306)

  return {
    platform: process.platform,
    checkedAt: new Date().toISOString(),
    components: {
      mysql: { installed: Boolean(mysql || mysqlService), path: mysql, service: mysqlService },
      php: { installed: Boolean(php), path: php },
      apache: { installed: Boolean(apache), path: apache },
      xampp: { installed: Boolean(xamppRoot), path: xamppRoot, mysqlReachable },
    },
  }
}

app.whenReady().then(() => {
  ipcMain.handle('system:detect-local-stack', () => detectLocalStack())
  ipcMain.handle('system:open-xampp', async () => {
    if (process.platform !== 'win32') return { ok: false, error: 'XAMPP can only be opened on Windows.' }
    const drive = process.env.SystemDrive || 'C:'
    const xamppRoot = [path.join(drive, 'xampp'), path.join(drive, 'Program Files', 'xampp')].find(fs.existsSync) || null
    if (!xamppRoot) return { ok: false, error: 'XAMPP was not found on this computer.' }
    const controlPanel = path.join(xamppRoot, 'xampp-control.exe')
    if (!fs.existsSync(controlPanel)) return { ok: false, error: 'The XAMPP Control Panel was not found. Start XAMPP manually.' }
    const failure = await shell.openPath(controlPanel)
    if (failure) return { ok: false, error: failure }
    return { ok: true }
  })
  ipcMain.handle('database:managed-status', async () => {
    const paths = managedPaths()
    const config = await readManagedConfig(paths)
    return {
      supported: process.platform === 'win32',
      installed: Boolean(
        config
        && fs.existsSync(paths.secret)
        && fs.existsSync(paths.data)
        && await findBinary(paths.engine, 'mysqld.exe'),
      ),
      running: Boolean(managedDatabaseProcess && managedDatabaseProcess.exitCode === null),
      version: config?.version || null,
      port: config?.port || null,
    }
  })
  ipcMain.handle('database:setup-managed', () => setupManagedDatabase())
  ipcMain.handle('database:start-managed', () => startManagedDatabase())
  ipcMain.handle('database:connect', async (_event, config) => {
    const host = typeof config?.host === 'string' ? config.host.trim() : ''
    const user = typeof config?.user === 'string' ? config.user : ''
    const password = typeof config?.password === 'string' ? config.password : ''
    const port = Number(config?.port)

    if (!host || host.length > 255) return { ok: false, error: 'Enter a valid database host.' }
    if (!user || user.length > 128) return { ok: false, error: 'Enter a valid database username.' }
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return { ok: false, error: 'Enter a valid port from 1 to 65535.' }
    }

    let connection
    try {
      connection = await mysql.createConnection({
        host,
        port,
        user,
        password,
        connectTimeout: 5000,
        multipleStatements: true,
      })
      const [rows] = await connection.query('SHOW DATABASES')
      const [versionRows] = await connection.query('SELECT VERSION() AS version')
      activeDatabaseConnection?.destroy()
      activeDatabaseConnection = connection
      return {
        ok: true,
        host,
        port,
        version: versionRows[0]?.version || 'MySQL server',
        databases: rows.map((row) => row.Database),
      }
    } catch (error) {
      connection?.destroy()
      const errorMessage = error.code === 'ECONNREFUSED'
        ? `Could not reach MySQL at ${host}:${port}. The server may be stopped. Start the MySQL service or check the connection details.`
        : error.code === 'ER_ACCESS_DENIED_ERROR'
          ? 'MySQL rejected these credentials. Check the username and password.'
          : error.message || 'Could not connect to the database.'
      return { ok: false, code: error.code || 'CONNECTION_FAILED', error: errorMessage }
    }
  })
  ipcMain.handle('database:list-tables', async (_event, database) => {
    if (!activeDatabaseConnection) return { ok: false, error: 'Connect to a database server first.' }
    if (typeof database !== 'string' || !database || database.length > 64) return { ok: false, error: 'Choose a valid database.' }
    try {
      const [rows] = await activeDatabaseConnection.query(`SHOW TABLES FROM ${mysql.escapeId(database)}`)
      return { ok: true, tables: rows.map((row) => Object.values(row)[0]) }
    } catch (error) {
      return { ok: false, error: error.message || 'Could not load tables.' }
    }
  })
  ipcMain.handle('database:get-schema', async (_event, database) => {
    if (!activeDatabaseConnection) return { ok: false, error: 'Connect to a database server first.' }
    if (typeof database !== 'string' || !database || database.length > 64) return { ok: false, error: 'Choose a valid database.' }
    try {
      const [tableRows] = await activeDatabaseConnection.query(`SHOW TABLES FROM ${mysql.escapeId(database)}`)
      const tableNames = tableRows.map((row) => Object.values(row)[0])
      const [foreignKeys] = await activeDatabaseConnection.query(
        'SELECT TABLE_NAME AS fromTable, COLUMN_NAME AS fromColumn, REFERENCED_TABLE_NAME AS toTable, REFERENCED_COLUMN_NAME AS toColumn FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL',
        [database],
      )
      const tables = await Promise.all(tableNames.map(async (name) => {
        const [columns] = await activeDatabaseConnection.query(`SHOW FULL COLUMNS FROM ${mysql.escapeId(database)}.${mysql.escapeId(name)}`)
        return {
          name,
          columns: columns.map((column) => ({
            name: column.Field,
            type: column.Type,
            nullable: column.Null === 'YES',
            key: column.Key || '',
            defaultValue: column.Default,
            extra: column.Extra || '',
          })),
        }
      }))
      return { ok: true, database, tables, relationships: foreignKeys }
    } catch (error) {
      return { ok: false, error: error.message || 'Could not load the database schema.' }
    }
  })
  ipcMain.handle('database:select-database', async (_event, database) => {
    if (!activeDatabaseConnection) return { ok: false, error: 'Connect to a database server first.' }
    if (typeof database !== 'string' || !database || database.length > 64) return { ok: false, error: 'Choose a valid database.' }
    try {
      await activeDatabaseConnection.query(`USE ${mysql.escapeId(database)}`)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error.message || 'Could not select database.' }
    }
  })
  ipcMain.handle('database:query', async (_event, sql) => {
    if (!activeDatabaseConnection) return { ok: false, error: 'Connect to a database server first.' }
    if (typeof sql !== 'string' || !sql.trim() || sql.length > 100000) return { ok: false, error: 'Enter a SQL statement under 100 KB.' }
    try {
      const [rows, fields] = await activeDatabaseConnection.query(sql)
      const multiple = Array.isArray(fields)
        && fields.some((fieldSet) => !fieldSet || Array.isArray(fieldSet))
      const rowSets = multiple ? rows : [rows]
      const fieldSets = multiple ? (fields || []) : [fields]
      const results = rowSets.map((rowSet, index) => {
        if (!Array.isArray(rowSet)) {
          const affectedRows = rowSet?.affectedRows || 0
          return { rows: [], columns: [], affectedRows, message: `${affectedRows} row(s) affected` }
        }
        const resultFields = fieldSets[index]
        const limitedRows = rowSet.slice(0, 500)
        return {
          rows: limitedRows,
          columns: (Array.isArray(resultFields) ? resultFields : []).map((field) => field.name),
          affectedRows: rowSet.length,
          truncated: rowSet.length > 500,
        }
      })
      return { ok: true, results, statementCount: results.length }
    } catch (error) {
      return { ok: false, error: error.message || 'The query failed.' }
    }
  })
  ipcMain.handle('database:disconnect', async () => {
    if (activeDatabaseConnection) await activeDatabaseConnection.end()
    activeDatabaseConnection = null
  })
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (!mainWindow) return
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })
  ipcMain.on('window:close', () => mainWindow?.close())

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

let shutdownInProgress = false
app.on('before-quit', (event) => {
  if (!managedDatabaseProcess || shutdownInProgress) {
    activeDatabaseConnection?.destroy()
    activeDatabaseConnection = null
    return
  }
  event.preventDefault()
  shutdownInProgress = true
  const paths = managedPaths()
  void (async () => {
    try {
      const config = await readManagedConfig(paths)
      const password = await getManagedPassword(paths)
      if (config) {
        const connection = await mysql.createConnection({
          host: '127.0.0.1',
          port: config.port,
          user: 'root',
          password,
          connectTimeout: 2000,
        })
        await connection.query('SHUTDOWN').catch(() => {})
        connection.destroy()
      }
    } catch {}
    activeDatabaseConnection?.destroy()
    activeDatabaseConnection = null
    const processHandle = managedDatabaseProcess
    if (processHandle && processHandle.exitCode === null) {
      await Promise.race([
        new Promise((resolve) => processHandle.once('exit', resolve)),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ])
      if (processHandle.exitCode === null) processHandle.kill()
    }
  })().finally(() => app.quit())
})
