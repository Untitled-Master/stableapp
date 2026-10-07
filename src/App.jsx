import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Code2,
  FilePlus2,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Plus,
  Search,
  Share2,
  Table2,
  Terminal,
  Check,
  CircleHelp,
  Database,
  Eye,
  EyeOff,
  HardDrive,
  LoaderCircle,
  RefreshCw,
  Server,
  Settings2,
  ShieldCheck,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppNavbar } from '@/components/app-navbar'
import { useTranslation } from 'react-i18next'
import { MySQL } from '@/components/mysql-logo'
import { Dropdown } from '@/components/dropdown'

const SqlEditor = lazy(() => import('@/components/sql-editor').then((module) => ({ default: module.SqlEditor })))
const SchemaCanvas = lazy(() => import('@/components/schema-canvas').then((module) => ({ default: module.SchemaCanvas })))

function ConnectDialog({
  credentials,
  setCredentials,
  connectionError,
  connecting,
  showPassword,
  setShowPassword,
  recentConnections,
  onRemoveRecent,
  showXamppPreset,
  showLocalPreset,
  localPort,
  onSubmit,
  onClose,
}) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="connect-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-background p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#00758f] p-1.5 text-white"><MySQL className="size-5" /></span><div><h2 id="connect-title" className="text-lg font-semibold">{t('connect.title')}</h2><p className="mt-0.5 text-sm text-muted-foreground">{t('connect.subtitle')}</p></div></div><button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={t('connect.close')}><X className="size-4" /></button></div>
        {(showXamppPreset || showLocalPreset) && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('connect.quickFill')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {showXamppPreset && (
                <button type="button" onClick={() => setCredentials({ host: '127.0.0.1', port: '3306', user: 'root', password: '' })} className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs hover:bg-accent">
                  <img src="./xampp-logo.svg" alt="" className="h-3.5 w-auto" /> XAMPP · :3306
                </button>
              )}
              {showLocalPreset && (
                <button type="button" onClick={() => setCredentials({ host: '127.0.0.1', port: String(localPort), user: 'root', password: '' })} className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs hover:bg-accent">
                  <Database className="size-3.5 text-primary" /> {t('connect.localDb', { port: localPort })}
                </button>
              )}
            </div>
          </div>
        )}
        {recentConnections.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('connect.recent')}</p>
            <div className="mt-1 divide-y divide-border/60">
              {recentConnections.map((entry) => (
                <div key={`${entry.host}:${entry.port}:${entry.user}`} className="group flex items-center gap-1 py-1.5">
                  <button type="button" onClick={() => setCredentials({ host: entry.host, port: String(entry.port), user: entry.user, password: '' })} className="min-w-0 flex-1 truncate py-1 text-left text-sm hover:text-primary" title={t('connect.fillDetails')}>
                    <span className="font-medium">{entry.user}</span>
                    <span className="text-muted-foreground">@{entry.host}:{entry.port}</span>
                  </button>
                  <button type="button" onClick={() => onRemoveRecent(entry)} className="shrink-0 rounded p-1 text-muted-foreground opacity-0 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100" title={t('connect.remove')}><X className="size-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
        <form className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4" onSubmit={onSubmit}>
                      <label className="grid gap-1 text-sm font-medium">{t('connect.host')}<input className="h-10 border-b border-border/60 bg-transparent px-1 font-normal outline-none placeholder:text-muted-foreground focus:border-primary" placeholder="127.0.0.1" value={credentials.host} onChange={(event) => setCredentials({ ...credentials, host: event.target.value })} required /></label>
                      <label className="grid gap-1 text-sm font-medium">{t('connect.port')}<input className="h-10 border-b border-border/60 bg-transparent px-1 font-normal outline-none placeholder:text-muted-foreground focus:border-primary" type="number" min="1" max="65535" placeholder="3306" value={credentials.port} onChange={(event) => setCredentials({ ...credentials, port: event.target.value })} required /></label>
                      <label className="grid gap-1 text-sm font-medium">{t('connect.username')}<input className="h-10 border-b border-border/60 bg-transparent px-1 font-normal outline-none placeholder:text-muted-foreground focus:border-primary" autoComplete="username" placeholder="root" value={credentials.user} onChange={(event) => setCredentials({ ...credentials, user: event.target.value })} required /></label>
            <label className="grid gap-1 text-sm font-medium">{t('connect.password')}
              <span className="flex h-10 items-center gap-1 border-b border-border/60 focus-within:border-primary">
                <input className="min-w-0 flex-1 bg-transparent px-1 font-normal outline-none placeholder:text-muted-foreground" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="shrink-0 rounded p-1.5 text-muted-foreground hover:text-foreground" title={showPassword ? t('connect.hidePw') : t('connect.showPw')}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
              </span>
            </label>
          {connectionError && <p role="alert" className="col-span-2 text-sm text-destructive">{connectionError}</p>}
            <div className="col-span-2 mt-1 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>{t('connect.cancel')}</Button><Button type="submit" disabled={connecting}>{connecting && <LoaderCircle className="mr-2 size-4 animate-spin" />}{connecting ? t('connect.connecting') : t('connect.connect')}{!connecting && <ArrowRight className="ml-2 size-4" />}</Button></div>
        </form>
      </section>
    </div>
  )
}

const APP_VERSION = '1.0.0'

function BackdropImage({ image, transparency }) {
  if (!image) return null
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center"
      style={{
        backgroundImage: `url(${image})`,
        opacity: (100 - transparency) / 100,
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
        maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
      }}
    />
  )
}

const requirements = [
  { id: 'mysql', nameKey: 'req.mysql', detailKey: 'req.mysqlDetail', icon: Database },
  { id: 'php', nameKey: 'req.php', detailKey: 'req.phpDetail', icon: HardDrive },
  { id: 'apache', nameKey: 'req.apache', detailKey: 'req.apacheDetail', icon: Server },
  { id: 'xampp', nameKey: 'req.xampp', detailKey: 'req.xamppDetail', icon: Settings2 },
]

function StatusIcon({ installed }) {
  return installed
    ? <Check className="size-4" />
    : <X className="size-4" />
}

function App() {
  const { t, i18n } = useTranslation()
  const [theme, setTheme] = useState(() => localStorage.getItem('stableapp:theme') || 'system')
  const [accentTheme, setAccentTheme] = useState(() => {
    const stored = localStorage.getItem('stableapp:accent-theme')
    return stored === 'vercel' || stored === 'github' || stored === 'grape' ? stored : 'default'
  })
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)
  const dark = theme === 'dark' || (theme === 'system' && systemDark)
  const [language, setLanguage] = useState(() => {
    const stored = localStorage.getItem('stableapp:language')
    return stored === 'fr' ? 'fr' : 'en'
  })
  const [collapseSidebarOnLaunch, setCollapseSidebarOnLaunch] = useState(() => localStorage.getItem('stableapp:collapse-sidebar') === 'true')
  const [editorFontSize, setEditorFontSize] = useState(() => Number(localStorage.getItem('stableapp:editor-font-size')) || 14)
  const [showLineNumbers, setShowLineNumbers] = useState(() => localStorage.getItem('stableapp:editor-line-numbers') !== 'false')
  const [stack, setStack] = useState(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [credentials, setCredentials] = useState({ host: '127.0.0.1', port: '3306', user: 'root', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [recentConnections, setRecentConnections] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('stableapp:recent-connections') || '[]')
      return Array.isArray(stored) ? stored.filter((entry) => entry && entry.host && entry.port && entry.user).slice(0, 5) : []
    } catch {
      return []
    }
  })
  const [connection, setConnection] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  const [managedDatabase, setManagedDatabase] = useState(null)
  const [preparingManagedDatabase, setPreparingManagedDatabase] = useState(false)
  const [managedDatabaseError, setManagedDatabaseError] = useState('')
  const [setupProgress, setSetupProgress] = useState('')
  const [selectedDatabase, setSelectedDatabase] = useState('')
  const [tables, setTables] = useState([])
  const [schemaData, setSchemaData] = useState(null)
  const [schemaError, setSchemaError] = useState('')
  const [loadingSchema, setLoadingSchema] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('Overview')
  const [sql, setSql] = useState('SELECT * FROM `table_name` LIMIT 100;')
  const [queryResult, setQueryResult] = useState(null)
  const [activeResult, setActiveResult] = useState(0)
  const [queryError, setQueryError] = useState('')
  const [runningQuery, setRunningQuery] = useState(false)
  const [expandedDatabases, setExpandedDatabases] = useState({})
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('stableapp:collapse-sidebar') === 'true')
  const [openingXampp, setOpeningXampp] = useState(false)
  const [xamppActionError, setXamppActionError] = useState('')
  const [backgroundImage, setBackgroundImage] = useState(() => {
    try {
      return localStorage.getItem('stableapp:bg-image') || ''
    } catch {
      return ''
    }
  })
  const [bgTransparency, setBgTransparency] = useState(() => {
    const stored = Number(localStorage.getItem('stableapp:bg-transparency'))
    return Number.isFinite(stored) && stored >= 0 && stored <= 100 ? stored : 80
  })
  const [bgError, setBgError] = useState('')
  const [showConnectionForm, setShowConnectionForm] = useState(false)
  const [showSetup, setShowSetup] = useState(true)

  const getLocalStack = useCallback(() => {
    if (!window.stableApp?.detectLocalStack) {
      return Promise.reject(new Error('System checks are available in the StableApp desktop app.'))
    }
    return window.stableApp.detectLocalStack()
  }, [])

  const scan = useCallback(async () => {
    setChecking(true)
    setError('')
    try {
      setStack(await getLocalStack())
    } catch (scanError) {
      setError(scanError.message || 'Could not check this computer.')
    } finally {
      setChecking(false)
    }
  }, [getLocalStack])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    const preference = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!preference) return undefined
    const update = (event) => setSystemDark(event.matches)
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    localStorage.setItem('stableapp:theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('stableapp:accent-theme', accentTheme)
    if (accentTheme === 'default') delete document.documentElement.dataset.accent
    else document.documentElement.dataset.accent = accentTheme
  }, [accentTheme])

  useEffect(() => {
    localStorage.setItem('stableapp:language', language)
    document.documentElement.lang = language
    document.documentElement.dir = 'ltr'
    void i18n.changeLanguage(language)
  }, [language, i18n])

  useEffect(() => {
    localStorage.setItem('stableapp:collapse-sidebar', String(collapseSidebarOnLaunch))
  }, [collapseSidebarOnLaunch])

  useEffect(() => {
    try {
      localStorage.setItem('stableapp:bg-transparency', String(bgTransparency))
    } catch {
      /* storage unavailable */
    }
  }, [bgTransparency])

  useEffect(() => {
    localStorage.setItem('stableapp:editor-font-size', String(editorFontSize))
  }, [editorFontSize])

  useEffect(() => {
    localStorage.setItem('stableapp:editor-line-numbers', String(showLineNumbers))
  }, [showLineNumbers])

  useEffect(() => {
    getLocalStack()
      .then(setStack)
      .catch((scanError) => setError(scanError.message || 'Could not check this computer.'))
      .finally(() => setChecking(false))
  }, [getLocalStack])

  useEffect(() => {
    let active = true
    const unsubscribe = window.stableApp?.onDatabaseSetupProgress?.((progress) => {
      setSetupProgress(progress.stage || '')
    })
    window.stableApp?.getManagedDatabaseStatus?.()
      .then((status) => {
        if (active) setManagedDatabase(status)
      })
      .catch((statusError) => {
        if (active) setManagedDatabaseError(statusError.message || 'Could not check the private database.')
      })
    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  const finishSetup = () => {
    localStorage.setItem('stableapp:setup-complete', 'true')
    setShowSetup(false)
  }

  const connectDatabase = async (event) => {
    event.preventDefault()
    setConnecting(true)
    setConnectionError('')
    try {
      const result = await window.stableApp.connectDatabase({
        ...credentials,
        port: Number(credentials.port),
      })
      if (!result.ok) {
        setConnectionError(result.error)
        return
      }
      setConnection(result)
      setSelectedDatabase('')
      setTables([])
      setShowConnectionForm(false)
      if (showSetup) finishSetup()
      const entry = { host: credentials.host.trim(), port: String(credentials.port), user: credentials.user }
      setRecentConnections((current) => {
        const next = [entry, ...current.filter((item) => !(item.host === entry.host && String(item.port) === String(entry.port) && item.user === entry.user))].slice(0, 5)
        localStorage.setItem('stableapp:recent-connections', JSON.stringify(next))
        return next
      })
      setCredentials((current) => ({ ...current, password: '' }))
    } catch (connectError) {
      setConnectionError(connectError.message || 'Could not connect to MySQL.')
    } finally {
      setConnecting(false)
    }
  }

  const disconnectDatabase = async () => {
    await window.stableApp?.disconnectDatabase()
    setConnection(null)
    setSelectedDatabase('')
    setTables([])
    setSchemaData(null)
    setActiveTab('Overview')
    setShowSetup(true)
  }

  const removeRecent = (entry) => {
    setRecentConnections((current) => {
      const next = current.filter((item) => !(item.host === entry.host && String(item.port) === String(entry.port) && item.user === entry.user))
      localStorage.setItem('stableapp:recent-connections', JSON.stringify(next))
      return next
    })
  }

  const chooseBackgroundImage = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setBgError(t('settings.bgErrorType'))
      return
    }
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        const maxDim = 1920
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(img.width * scale))
        canvas.height = Math.max(1, Math.round(img.height * scale))
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
        localStorage.setItem('stableapp:bg-image', dataUrl)
        setBackgroundImage(dataUrl)
        setBgTransparency(90)
        setBgError('')
      } catch {
        setBgError(t('settings.bgErrorSave'))
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      setBgError(t('settings.bgErrorLoad'))
    }
    img.src = objectUrl
  }

  const removeBackgroundImage = () => {
    try {
      localStorage.removeItem('stableapp:bg-image')
    } catch {
      /* storage unavailable */
    }
    setBackgroundImage('')
    setBgError('')
  }

  const prepareManagedDatabase = async () => {
    setPreparingManagedDatabase(true)
    setManagedDatabaseError('')
    setSetupProgress(managedDatabase?.installed ? 'Starting StableApp’s private database' : 'Preparing the private database')
    try {
      const result = managedDatabase?.installed
        ? await window.stableApp.startManagedDatabase()
        : await window.stableApp.setupManagedDatabase()
      if (!result.ok) {
        setManagedDatabaseError(result.error)
        return
      }
      setConnection(result)
      setManagedDatabase(await window.stableApp.getManagedDatabaseStatus())
      setSetupProgress('')
      if (showSetup) finishSetup()
    } catch (setupError) {
      setManagedDatabaseError(setupError.message || 'Could not prepare the private database.')
    } finally {
      setPreparingManagedDatabase(false)
    }
  }

  const openXamppControl = async () => {
    setOpeningXampp(true)
    setXamppActionError('')
    try {
      if (!window.stableApp?.openXampp) {
        setXamppActionError('Opening XAMPP is available in the StableApp desktop app.')
        return
      }
      const result = await window.stableApp.openXampp()
      if (!result.ok) setXamppActionError(result.error || 'Could not open the XAMPP Control Panel.')
    } catch (openError) {
      setXamppActionError(openError.message || 'Could not open the XAMPP Control Panel.')
    } finally {
      setOpeningXampp(false)
    }
  }

  const chooseDatabase = async (database) => {
    setSelectedDatabase(database)
    setActiveTab('Schema')
    setQueryError('')
    setSchemaData(null)
    setSchemaError('')
    setLoadingSchema(true)
    const [selected, result, schema] = await Promise.all([
      window.stableApp.selectDatabase(database),
      window.stableApp.listTables(database),
      window.stableApp.getSchema(database),
    ])
    if (!selected.ok) setQueryError(selected.error)
    if (result.ok) setTables(result.tables)
    else setQueryError(result.error)
    if (schema.ok) setSchemaData(schema)
    else setSchemaError(schema.error)
    setLoadingSchema(false)
  }

  const executeQuery = async () => {
    setRunningQuery(true)
    setQueryError('')
    setQueryResult(null)
    try {
      const result = await window.stableApp.runQuery(sql)
      if (!result.ok) setQueryError(result.error)
      else {
        setQueryResult(result)
        setActiveResult(0)
        if (selectedDatabase) {
          const [refreshed, refreshedSchema] = await Promise.all([
            window.stableApp.listTables(selectedDatabase),
            window.stableApp.getSchema(selectedDatabase),
          ])
          if (refreshed.ok) setTables(refreshed.tables)
          if (refreshedSchema.ok) setSchemaData(refreshedSchema)
        }
      }
    } catch (runError) {
      setQueryError(runError.message || 'The query failed.')
    } finally {
      setRunningQuery(false)
    }
  }

  const openTable = (table) => {
    const safeDatabase = selectedDatabase.replaceAll('`', '``')
    const safeTable = String(table).replaceAll('`', '``')
    setSql(`SELECT * FROM \`${safeDatabase}\`.\`${safeTable}\` LIMIT 100;`)
    setActiveTab('SQL')
    setQueryError('')
    setQueryResult(null)
  }

  const componentStatus = stack?.components ?? {}
  const currentResult = queryResult?.results?.[activeResult]
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const matchingDatabases = (connection?.databases || []).filter((database) => database.toLowerCase().includes(normalizedSearch))
  const matchingTables = tables.filter((table) => table.toLowerCase().includes(normalizedSearch))
  const schemaColumns = schemaData?.tables?.flatMap((table) => table.columns.map((column) => ({ name: column.name, table: table.name }))) ?? []
  const xamppStatus = componentStatus.xampp
  const xamppMysqlUp = Boolean(xamppStatus?.mysqlReachable)
  const managedRunning = Boolean(managedDatabase?.running)
  const tabLabels = {
    Overview: t('tabs.overview'),
    SQL: t('tabs.sql'),
    Search: t('tabs.search'),
    Schema: t('tabs.schema'),
    Settings: t('tabs.settings'),
  }

  if (showSetup) {
    return (
      <div className="isolate flex h-screen flex-col overflow-hidden bg-background text-foreground">
        <BackdropImage image={backgroundImage} transparency={bgTransparency} />
        <header className="flex h-12 items-center px-6" style={{ WebkitAppRegion: 'drag' }}>
          <span className="text-sm font-semibold tracking-tight">StableApp</span>
          <div className="ml-auto flex" style={{ WebkitAppRegion: 'no-drag' }}>
            <Button size="icon" variant="ghost" title={t('navbar.minimize')} onClick={() => window.windowControls?.minimize()}>
              <span className="text-lg leading-none">−</span>
            </Button>
            <Button size="icon" variant="ghost" title={t('navbar.close')} onClick={() => window.windowControls?.close()}>
              <X className="size-4" />
            </Button>
          </div>
        </header>

        <main className="mx-auto flex h-[calc(100vh-3rem)] min-h-0 w-full max-w-6xl flex-col overflow-y-auto px-6 py-6 lg:px-10">
          <div className="m-auto w-full">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-12">
            <div>
            <section>
              <img src="./Stable.png" alt="StableApp" className="mb-6 size-32 rounded-3xl object-cover" />
              <p className="mb-3 text-sm font-medium text-primary">{t('setup.eyebrow')}</p>
              <h1 className="max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">
                {t('setup.title')}
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                {t('setup.subtitle')}
              </p>
              <div className="mt-5 space-y-2.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 shrink-0 text-primary" />
                  <span>{t('setup.checkNote')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CircleHelp className="size-4 shrink-0 text-primary" />
                  <span>{t('setup.helpNote')}</span>
                </div>
              </div>
            </section>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button className="h-11 flex-1" onClick={finishSetup} disabled={checking || !connection}>
                {t('setup.continue')} <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button variant="ghost" className="h-11" onClick={scan} disabled={checking}>
                {t('common.checkAgain')}
              </Button>
            </div>
            {!checking && !connection && (
              <p className="mt-3 text-xs text-muted-foreground">{t('setup.gateNote')}</p>
            )}
            <p className="mt-6 text-xs text-muted-foreground">
                {t('setup.version', { version: APP_VERSION })}
              </p>
            </div>

            <div>
            <section aria-label="Environment check">
              <div className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{t('env.title')}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {checking ? t('env.checking') : t('env.detected')}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={scan} disabled={checking} title={t('common.checkAgain')}>
                  {checking ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                </Button>
              </div>

              <div className="divide-y divide-border/60" aria-live="polite">
                {requirements.map(({ id, nameKey, detailKey, icon: Icon }) => {
                  const item = componentStatus[id]
                  const installed = Boolean(item?.installed)
                  return (
                    <div key={id} className="flex items-center gap-3 py-2.5">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{t(nameKey)}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {checking
                            ? t('common.checking')
                            : item?.service
                              ? t('env.serviceState', { name: item.service.name, state: item.service.running ? t('env.stateRunning') : t('env.stateStopped') })
                              : id === 'xampp' && item?.installed
                                ? t('env.xamppDetail', { path: item.path, state: item.mysqlReachable ? t('env.reachable') : t('env.notReachable') })
                                : item?.path || t(detailKey)}
                        </p>
                      </div>
                      {!checking && item && (
                        <span className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${installed ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                          <StatusIcon installed={installed} />
                          {installed ? t('common.found') : t('common.notFound')}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
            </section>

            <section aria-label="Private database" className="mt-6 border-t pt-5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"><Database className="size-3.5" /></span>
                <h3 className="text-sm font-semibold">{t('setup.privateTitle')}</h3>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                {managedDatabase?.installed
                  ? t('setup.privateReady', { version: managedDatabase.version, state: managedDatabase.running ? t('setup.privateStateRunning') : t('setup.privateStateReady') })
                  : t('setup.privateMissing')}
              </p>
              {setupProgress && <p className="mt-1.5 text-xs text-primary" aria-live="polite">{setupProgress}</p>}
              <div className="mt-2">
                <Button size="sm" onClick={prepareManagedDatabase} disabled={preparingManagedDatabase || managedDatabase?.supported === false}>
                  {preparingManagedDatabase && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                  {preparingManagedDatabase
                    ? t('setup.preparing')
                    : managedDatabase?.installed
                      ? managedDatabase.running ? t('setup.connectExisting') : t('setup.startExisting')
                      : t('setup.setupNew')}
                </Button>
              </div>
              {managedDatabaseError && <p role="alert" className="mt-2 whitespace-pre-wrap text-sm text-destructive">{managedDatabaseError}</p>}
            </section>
            {!checking && !error && xamppStatus?.installed && !xamppMysqlUp && (
              <section aria-label="XAMPP status" className="mt-6 border-t pt-5">
                <div className="flex items-center gap-2.5">
                  <img src="./xampp-logo.svg" alt="XAMPP" className="size-8 shrink-0 rounded-full bg-muted p-1.5" />
                  <h3 className="text-sm font-semibold">{t('xampp.notRunning')}</h3>
                </div>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  {t('xampp.notReachableDesc')}
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Button size="sm" variant="outline" onClick={openXamppControl} disabled={openingXampp}>
                    {openingXampp && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                    {openingXampp ? t('xampp.opening') : t('xampp.openPanel')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={scan} disabled={checking}>{t('common.recheck')}</Button>
                </div>
                {xamppActionError && <p role="alert" className="mt-2 text-xs text-destructive">{xamppActionError}</p>}
              </section>
            )}
            {!checking && !error && xamppMysqlUp && !connection && (
              <section aria-label="Connect to XAMPP" className="mt-6 border-t pt-5">
                <div className="flex items-center gap-2.5">
                  <img src="./xampp-logo.svg" alt="XAMPP" className="size-8 shrink-0 rounded-full bg-muted p-1.5" />
                  <h3 className="text-sm font-semibold">{t('xampp.reachableTitle')}</h3>
                </div>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  {t('xampp.reachableSetupDesc')}
                </p>
                <div className="mt-2">
                  <Button size="sm" onClick={() => { setCredentials({ host: '127.0.0.1', port: '3306', user: 'root', password: '' }); setShowConnectionForm(true) }}>{t('xampp.connectTo')}</Button>
                </div>
              </section>
            )}
            </div>
          </div>
          </div>
        </main>
      {showConnectionForm && (
        <ConnectDialog
          credentials={credentials}
          setCredentials={setCredentials}
          connectionError={connectionError}
          connecting={connecting}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          recentConnections={recentConnections}
          onRemoveRecent={removeRecent}
          showXamppPreset={Boolean(xamppStatus?.installed)}
          showLocalPreset={Boolean(managedDatabase?.installed && managedDatabase.port)}
          localPort={managedDatabase?.port}
          onSubmit={connectDatabase}
          onClose={() => setShowConnectionForm(false)}
        />
      )}
      </div>
    )
  }

  return (
    <div className="isolate flex h-screen min-h-[600px] overflow-hidden bg-background text-foreground">
      <BackdropImage image={backgroundImage} transparency={bgTransparency} />
        <aside className={`flex shrink-0 flex-col border-r bg-transparent text-foreground transition-[width] duration-200 ${sidebarCollapsed ? 'w-[68px]' : 'w-[264px]'}`}>
          <div className={sidebarCollapsed ? 'flex shrink-0 flex-col items-center gap-2 px-2 pb-1 pt-4' : 'ml-1 mt-2 flex h-12 shrink-0 items-center gap-2 pl-2 pr-3'} style={{ WebkitAppRegion: 'drag' }}>
            <img src="./Stable.png" alt="StableApp" className="size-7 shrink-0 rounded-lg object-cover" />
            {!sidebarCollapsed && (
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-sm font-semibold">StableApp</span>
                <span className="block text-[11px] font-normal text-muted-foreground">v{APP_VERSION}</span>
              </span>
            )}
            <button onClick={() => setSidebarCollapsed((collapsed) => !collapsed)} className={`${sidebarCollapsed ? '' : 'ml-auto'} shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground`} style={{ WebkitAppRegion: 'no-drag' }} title={sidebarCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}>{sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}</button>
          </div>

          <div className={`${sidebarCollapsed ? 'px-2 py-2' : 'px-3 py-2'}`}>
            {sidebarCollapsed ? (
              <button onClick={() => setActiveTab('Search')} className="mx-auto flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" title={t('sidebar.searchTitle')}><Search className="size-4" /></button>
            ) : (
              <label className="flex h-9 items-center gap-2 border-b border-border/60 px-1 focus-within:border-primary">
                <Search className="size-3.5 shrink-0 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onFocus={() => { if (!connection) setActiveTab('Search') }}
                  placeholder={t('sidebar.searchPh')}
                  className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                />
                {searchTerm
                  ? <button onClick={() => setSearchTerm('')} className="rounded p-0.5 text-muted-foreground hover:text-foreground" title={t('sidebar.clearSearchTitle')}><X className="size-3" /></button>
                  : <button onClick={() => setActiveTab('Search')} className="rounded p-0.5 text-muted-foreground hover:text-foreground" title={t('sidebar.openSearchTitle')}><ChevronRight className="size-3" /></button>}
              </label>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            <div className={`mb-1 flex items-center gap-1 ${sidebarCollapsed ? 'justify-center' : 'justify-between px-1'}`}>
              {!sidebarCollapsed && (
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('sidebar.databases')} {connection ? <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium normal-case">{matchingDatabases.length}</span> : null}
                </span>
              )}
              {!sidebarCollapsed && (
                <button onClick={() => setShowConnectionForm(true)} className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" title={t('sidebar.newConnection')}><Plus className="size-3.5" /></button>
              )}
            </div>

            {!connection ? (
              sidebarCollapsed ? (
                <button onClick={() => setShowConnectionForm(true)} title={t('connect.title')} className="mx-auto flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"><Database className="size-4" /></button>
              ) : (
                <div className="px-3 py-6 text-center">
                  <Database className="mx-auto size-6 text-muted-foreground/50" />
                  <p className="mt-2 text-xs font-medium">{t('sidebar.noServer')}</p>
                  <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{t('sidebar.noServerHint')}</p>
                </div>
              )
            ) : matchingDatabases.length === 0 ? (
              !sidebarCollapsed && (
                <div className="px-3 py-6 text-center">
                  <p className="text-xs font-medium">{t('sidebar.noMatches', { q: searchTerm })}</p>
                  <button onClick={() => setSearchTerm('')} className="mt-2 text-xs font-medium text-primary hover:underline">{t('sidebar.clearFilter')}</button>
                </div>
              )
            ) : (
              <div className="space-y-0.5">
                {matchingDatabases.map((database) => {
                  const expanded = expandedDatabases[database] ?? (selectedDatabase === database)
                  const selected = selectedDatabase === database
                  return (
                    <div key={database}>
                      <button
                        title={database}
                        aria-expanded={expanded}
                        aria-current={selected ? 'true' : undefined}
                        onClick={() => { setExpandedDatabases((current) => ({ ...current, [database]: !expanded })); if (selectedDatabase !== database) void chooseDatabase(database) }}
                        className={`group flex w-full items-center gap-1.5 rounded-lg py-1.5 text-left text-sm transition-colors ${sidebarCollapsed ? 'justify-center px-0' : 'px-1.5'} ${selected ? 'bg-accent font-medium' : 'hover:bg-accent/70'}`}
                      >
                        {!sidebarCollapsed && <span className="shrink-0 text-muted-foreground">{expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}</span>}
                        <Database className={`size-4 shrink-0 ${selected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                        {!sidebarCollapsed && <span className="min-w-0 flex-1 truncate">{database}</span>}
                        {!sidebarCollapsed && selected && tables.length > 0 && <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{tables.length}</span>}
                      </button>
                      {!sidebarCollapsed && expanded && selected && (
                        <div className="mb-1 ml-[15px] border-l border-border/70 pl-1.5">
                          {matchingTables.length ? matchingTables.map((table) => (
                            <button key={table} onClick={() => openTable(table)} title={t('sidebar.openTableTitle', { table })} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                              <Table2 className="size-3.5 shrink-0" />
                              <span className="truncate">{table}</span>
                            </button>
                          )) : (
                            <p className="px-2 py-1.5 text-[11px] text-muted-foreground">{t('sidebar.noTables')}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className={`${sidebarCollapsed ? 'px-2' : 'px-3'} border-t py-2.5`}>
            {!sidebarCollapsed && <p className="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('sidebar.serverLabel')}</p>}
            <button
              onClick={() => setShowConnectionForm(true)}
              title={connection ? t('sidebar.serverConnectedTitle', { host: connection.host, port: connection.port }) : t('sidebar.serverOfflineTitle')}
              className={`mt-1.5 flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
            >
              <span className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#00758f] p-1.5 text-white">
                <MySQL className="size-5" />
                <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-background ${connection ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
              </span>
              {!sidebarCollapsed && (
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{connection?.managed ? t('sidebar.localName') : connection ? `${connection.host}:${connection.port}` : t('sidebar.noConnection')}</span>
                    {connection?.managed && <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{t('sidebar.localBadge')}</span>}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{connection ? t('sidebar.serverDetail', { version: connection.version, count: connection.databases.length }) : t('sidebar.connectToServer')}</span>
                </span>
              )}
            </button>
            {!sidebarCollapsed && !connection && (
              <Button size="sm" className="mt-2 w-full" onClick={() => setShowConnectionForm(true)}>
                <Plus className="mr-1.5 size-3.5" /> {t('sidebar.connectCta')}
              </Button>
            )}
            <div className="mt-1.5">
              <button onClick={() => setActiveTab('Settings')} title={t('sidebar.settings')} className={`flex w-full items-center gap-2.5 rounded-lg py-2 text-sm transition-colors ${sidebarCollapsed ? 'justify-center px-0' : 'px-2.5'} ${activeTab === 'Settings' ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}><Settings2 className="size-4 shrink-0" />{!sidebarCollapsed && t('sidebar.settings')}</button>
              {connection && <button onClick={disconnectDatabase} title={t('sidebar.disconnectTitle')} className={`flex w-full items-center gap-2.5 rounded-lg py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive ${sidebarCollapsed ? 'justify-center px-0' : 'px-2.5'}`}><X className="size-4 shrink-0" />{!sidebarCollapsed && t('sidebar.disconnect')}</button>}
              {!sidebarCollapsed && <p className="mt-1.5 px-2.5 text-[11px] leading-4 text-muted-foreground/80">{t('sidebar.versionLine', { version: APP_VERSION })}</p>}
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <AppNavbar dark={dark} onToggleDark={() => setTheme(dark ? 'light' : 'dark')} onAddConnection={() => setShowConnectionForm(true)} page={tabLabels[activeTab] || activeTab} />
          <div className="flex shrink-0 items-center gap-1 px-4 pt-2">
            {[['Overview', LayoutDashboard], ['SQL', Code2], ['Search', Search], ['Schema', Share2], ['Settings', Settings2]].map(([tab, Icon]) => <button key={tab} onClick={() => setActiveTab(tab)} className={`relative flex items-center gap-2 rounded-t-md px-3 py-2 text-sm ${activeTab === tab ? 'bg-background font-medium text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:bg-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}><Icon className="size-4" />{tabLabels[tab]}{tab === 'SQL' && <span className="ml-1 rounded bg-muted px-1.5 text-[10px]">⌘↵</span>}</button>)}
            <button onClick={() => { setActiveTab('SQL'); setSql('') }} className="ml-1 rounded-md p-2 text-muted-foreground hover:bg-accent" title={t('sql.newTab')}><FilePlus2 className="size-4" /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-5 py-5 lg:px-8">
            {activeTab === 'Overview' && <div className="mx-auto w-full max-w-6xl">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">{t('overview.eyebrow')}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">{t('overview.title')}</h1><p className="mt-2 text-sm text-muted-foreground">{t('overview.subtitle')}</p></div><Button onClick={() => connection ? setActiveTab('SQL') : setShowSetup(true)}><Code2 className="mr-2 size-4" />{connection ? t('overview.newQuery') : t('overview.connectDatabase')}</Button></div>
              <section aria-label="Status">
                <div className="divide-y divide-border/60">
                  {connection ? (
                    <div className="flex items-center gap-3 py-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"><Database className="size-4" /></div>
                      <div className="min-w-0 flex-1"><p className="text-sm font-medium">{t('overview.connectionTitle')}</p><p className="truncate text-xs text-muted-foreground">{t('overview.connectionDetail', { version: connection.version, count: connection.databases.length })}</p></div>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"><span className="size-2 rounded-full bg-emerald-500" />{t('overview.connected')}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 py-3">
                        <img src="./xampp-logo.svg" alt="XAMPP" className="size-9 shrink-0 rounded-full bg-muted p-2" />
                        <div className="min-w-0 flex-1"><p className="text-sm font-medium">XAMPP</p><p className="truncate text-xs text-muted-foreground">{checking ? t('overview.probing') : !xamppStatus?.installed ? t('overview.xamppBundleMissing') : xamppMysqlUp ? t('overview.xamppReachable') : t('overview.xamppUnreachable')}</p></div>
                        <span className={`shrink-0 text-xs font-medium ${xamppMysqlUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>{checking ? t('common.checking') : !xamppStatus?.installed ? t('common.notInstalled') : xamppMysqlUp ? t('common.running') : t('common.stopped')}</span>
                      </div>
                      <div className="flex items-center gap-3 py-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"><HardDrive className="size-4" /></div>
                        <div className="min-w-0 flex-1"><p className="text-sm font-medium">{t('overview.localTitle')}</p><p className="truncate text-xs text-muted-foreground">{managedDatabase?.installed ? t('overview.localDetail', { version: managedDatabase.version }) : t('overview.localMissing')}</p></div>
                        <span className={`shrink-0 text-xs font-medium ${managedRunning ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>{managedRunning ? t('common.running') : managedDatabase?.installed ? t('common.stopped') : t('common.notConfigured')}</span>
                      </div>
                    </>
                  )}
                </div>
              </section>
              {!checking && xamppStatus?.installed && !xamppMysqlUp && !managedRunning && !connection && (
                <section aria-label="Start a server" className="mt-6 border-t pt-5">
                  <div className="flex items-center gap-2.5">
                    <img src="./xampp-logo.svg" alt="XAMPP" className="h-6 w-auto" />
                    <h2 className="text-sm font-semibold">{t('xampp.notRunning')}</h2>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground sm:text-sm">{t('xampp.notReachableDesc')}</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Button size="sm" onClick={openXamppControl} disabled={openingXampp}>{openingXampp && <LoaderCircle className="mr-2 size-4 animate-spin" />}{openingXampp ? t('xampp.opening') : t('xampp.openPanel')}</Button>
                    <Button size="sm" variant="outline" onClick={prepareManagedDatabase} disabled={preparingManagedDatabase}>{preparingManagedDatabase && <LoaderCircle className="mr-2 size-4 animate-spin" />}{preparingManagedDatabase ? t('setup.preparing') : t('setup.startExisting')}</Button>
                    <Button size="sm" variant="ghost" onClick={scan} disabled={checking}>{t('common.recheck')}</Button>
                  </div>
                  {xamppActionError && <p role="alert" className="mt-2 text-xs text-destructive">{xamppActionError}</p>}
                </section>
              )}
              {!checking && xamppMysqlUp && !connection && (
                <section aria-label="Connect to XAMPP" className="mt-6 border-t pt-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <img src="./xampp-logo.svg" alt="XAMPP" className="h-6 w-auto shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-semibold">{t('xampp.reachableTitle')}</h2>
                      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{t('xampp.reachableOverviewDesc')}</p>
                    </div>
                    <Button size="sm" onClick={() => setShowConnectionForm(true)}>{t('xampp.connectTo')}</Button>
                  </div>
                </section>
              )}
              <section aria-label="Databases" className="mt-6 border-t pt-5">
                <div className="flex items-center justify-between gap-4"><div><h2 className="text-sm font-semibold">{t('overview.dbsTitle')}</h2><p className="mt-1 text-xs text-muted-foreground">{t('overview.dbsHint')}</p></div><button onClick={() => setActiveTab('SQL')} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"><Terminal className="size-3.5" /> {t('overview.openSql')}</button></div>
                {connection ? <div className="mt-2 divide-y divide-border/60">{connection.databases.map((database) => <button key={database} onClick={() => void chooseDatabase(database)} className="flex w-full items-center gap-3 py-3 text-left"><Database className="size-4 shrink-0 text-primary" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{database}</span><ChevronRight className="size-4 shrink-0 text-muted-foreground" /></button>)}</div> : <div className="py-10 text-center"><Database className="mx-auto size-8 text-muted-foreground/50" /><p className="mt-3 text-sm font-medium">{t('overview.emptyTitle')}</p><p className="mt-1 text-xs text-muted-foreground">{t('overview.emptyDesc')}</p><Button className="mt-4" onClick={() => setShowConnectionForm(true)}>{t('overview.emptyCta')}</Button></div>}
              </section>
              {managedDatabaseError && <p className="mt-4 text-sm text-destructive">{managedDatabaseError}</p>}
            </div>}

            {activeTab === 'Settings' && <div className="mx-auto w-full max-w-6xl">
              <div className="mb-6"><p className="text-sm text-muted-foreground">{t('settings.eyebrow')}</p><h1 className="mt-1 text-2xl font-semibold">{t('settings.title')}</h1><p className="mt-2 text-sm text-muted-foreground">{t('settings.subtitle')}</p></div>
              <div>
                <section aria-label="Appearance" className="mt-8 border-t pt-6">
                  <h2 className="text-sm font-semibold">{t('settings.appearance')}</h2><p className="mt-1 text-xs text-muted-foreground">{t('settings.appearanceDesc')}</p>
                  <div className="mt-4 grid max-w-sm gap-1.5 text-sm font-medium"><span>{t('settings.themeLabel')}</span><Dropdown label={t('settings.themeLabel')} value={theme} onChange={setTheme} options={[{ value: 'light', label: t('settings.themeLight') }, { value: 'dark', label: t('settings.themeDark') }, { value: 'system', label: t('settings.themeSystem') }]} /></div>
                  <div className="mt-4 grid max-w-sm gap-1.5 text-sm font-medium"><span>{t('settings.accentLabel')}</span><Dropdown label={t('settings.accentLabel')} value={accentTheme} onChange={setAccentTheme} options={[{ value: 'default', label: t('settings.accentDefault') }, { value: 'vercel', label: t('settings.accentVercel') }, { value: 'github', label: t('settings.accentGithub') }, { value: 'grape', label: t('settings.accentGrape') }]} /></div>
                </section>

                <section aria-label="Background" className="mt-8 border-t pt-6">
                  <h2 className="text-sm font-semibold">{t('settings.background')}</h2><p className="mt-1 text-xs text-muted-foreground">{t('settings.backgroundDesc')}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {backgroundImage && <img src={backgroundImage} alt="" className="h-14 w-24 rounded-md border object-cover" />}
                    <label className="inline-flex h-9 cursor-pointer items-center rounded-md border px-3 text-sm hover:bg-accent">
                      <input type="file" accept="image/*" className="sr-only" onChange={chooseBackgroundImage} />
                      {backgroundImage ? t('settings.changeImage') : t('settings.chooseImage')}
                    </label>
                    {backgroundImage && <Button size="sm" variant="ghost" onClick={removeBackgroundImage}>{t('settings.removeImage')}</Button>}
                  </div>
                  {backgroundImage && (
                    <label className="mt-4 grid max-w-sm gap-2 text-sm font-medium">
                      <span className="flex items-center justify-between"><span>{t('settings.transparency')}</span><span className="text-muted-foreground">{bgTransparency} %</span></span>
                      <input type="range" min="0" max="100" value={bgTransparency} onChange={(event) => setBgTransparency(Number(event.target.value))} className="w-full accent-primary" />
                    </label>
                  )}
                  {bgError && <p role="alert" className="mt-2 text-xs text-destructive">{bgError}</p>}
                </section>

                <section aria-label="Language" className="mt-8 border-t pt-6">
                  <h2 className="text-sm font-semibold">{t('settings.language')}</h2><p className="mt-1 text-xs text-muted-foreground">{t('settings.languageDesc')}</p>
                  <div className="mt-4 grid max-w-sm gap-1.5 text-sm font-medium"><span>{t('settings.languageLabel')}</span><Dropdown label={t('settings.languageLabel')} value={language} onChange={setLanguage} options={[{ value: 'en', label: t('settings.english') }, { value: 'fr', label: t('settings.french') }]} /></div>
                </section>

                <section aria-label="Workspace" className="mt-8 border-t pt-6">
                  <h2 className="text-sm font-semibold">{t('settings.workspace')}</h2><p className="mt-1 text-xs text-muted-foreground">{t('settings.workspaceDesc')}</p>
                  <div className="mt-2 divide-y divide-border/60">
                    <label className="flex cursor-pointer items-start gap-3 py-3"><input type="checkbox" checked={collapseSidebarOnLaunch} onChange={(event) => { const checked = event.target.checked; setCollapseSidebarOnLaunch(checked); setSidebarCollapsed(checked) }} className="mt-0.5 size-4 accent-primary" /><span><span className="block text-sm font-medium">{t('settings.collapseOpt')}</span><span className="mt-1 block text-xs text-muted-foreground">{t('settings.collapseHint')}</span></span></label>
                    <div className="flex flex-wrap items-center justify-between gap-4 py-3"><span className="text-sm font-medium">{t('settings.fontSize')}</span><Dropdown label={t('settings.fontSize')} direction="up" value={editorFontSize} onChange={setEditorFontSize} options={[12, 13, 14, 16, 18, 20].map((size) => ({ value: size, label: `${size}px` }))} className="w-28" /></div>
                    <label className="flex cursor-pointer items-center gap-3 py-3"><input type="checkbox" checked={showLineNumbers} onChange={(event) => setShowLineNumbers(event.target.checked)} className="size-4 accent-primary" /><span className="text-sm font-medium">{t('settings.lineNumbers')}</span></label>
                  </div>
                </section>

                <section aria-label="About" className="mt-8 border-t pt-6">
                  <h2 className="text-sm font-semibold">{t('settings.about')}</h2>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">S</span>
                    <div className="min-w-0"><p className="truncate text-sm font-semibold">{t('settings.aboutApp', { version: APP_VERSION })}</p><p className="mt-0.5 text-xs text-muted-foreground">{t('settings.aboutBy')}</p></div>
                  </div>
                </section>

                <div className="mt-8 flex justify-end border-t pt-6">
                  <Button variant="outline" onClick={() => setShowSetup(true)}><RefreshCw className="mr-2 size-4" /> {t('settings.envSetup')}</Button>
                </div>
              </div>
            </div>}

            {activeTab === 'Search' && <div className="mx-auto w-full max-w-6xl">
              <div className="mb-6"><p className="text-sm text-muted-foreground">{t('search.eyebrow')}</p><h1 className="mt-1 text-2xl font-semibold">{t('search.title')}</h1><p className="mt-2 text-sm text-muted-foreground">{t('search.subtitle')}</p></div>
              <label className="flex h-11 items-center gap-3 border-b border-border/60 px-1 focus-within:border-primary"><Search className="size-4 shrink-0 text-muted-foreground" /><input autoFocus value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={t('search.placeholder')} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /><span className="text-xs text-muted-foreground">{connection ? t('search.online') : t('search.offline')}</span></label>
              {!connection ? <div className="py-12 text-center text-sm text-muted-foreground">{t('search.needConnection')}</div> : !normalizedSearch ? <div className="py-12 text-center text-sm text-muted-foreground">{t('search.typeToSearch')}</div> : <div className="mt-8 grid gap-8 lg:grid-cols-2">
                <section><h2 className="text-sm font-semibold">{t('search.dbsTitle')} <span className="ml-1 text-xs font-normal text-muted-foreground">{matchingDatabases.length}</span></h2>{matchingDatabases.length ? <div className="mt-1 divide-y divide-border/60">{matchingDatabases.map((database) => <button key={database} onClick={() => void chooseDatabase(database)} className="flex w-full items-center gap-3 py-2.5 text-left text-sm"><Database className="size-4 shrink-0 text-primary" /><span className="min-w-0 flex-1 truncate">{database}</span><ChevronRight className="size-4 shrink-0 text-muted-foreground" /></button>)}</div> : <p className="py-3 text-sm text-muted-foreground">{t('search.noDbs')}</p>}</section>
                <section><h2 className="text-sm font-semibold">{t('search.tablesTitle')}{selectedDatabase && <span className="ml-1 text-xs font-normal text-muted-foreground">{t('search.tablesIn', { db: selectedDatabase, count: matchingTables.length })}</span>}</h2>{matchingTables.length ? <div className="mt-1 divide-y divide-border/60">{matchingTables.map((table) => <button key={table} onClick={() => openTable(table)} className="flex w-full items-center gap-3 py-2.5 text-left text-sm"><Table2 className="size-4 shrink-0 text-primary" /><span className="min-w-0 flex-1 truncate">{table}</span><ChevronRight className="size-4 shrink-0 text-muted-foreground" /></button>)}</div> : <p className="py-3 text-sm text-muted-foreground">{selectedDatabase ? t('search.noTables') : t('search.pickDb')}</p>}</section>
              </div>}
            </div>}

            {activeTab === 'Schema' && <div className="mx-auto w-full max-w-6xl">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">{t('schema.eyebrow')}</p><h1 className="mt-1 text-2xl font-semibold">{selectedDatabase || t('schema.viewTitle')}</h1><p className="mt-2 text-sm text-muted-foreground">{t('schema.subtitle')}</p></div>{schemaData && <div className="flex gap-2 text-xs"><span className="rounded-md bg-muted px-2.5 py-1.5">{t('schema.tablesBadge', { count: schemaData.tables.length })}</span><span className="rounded-md bg-muted px-2.5 py-1.5">{t('schema.relsBadge', { count: schemaData.relationships.length })}</span></div>}</div>
              {!connection ? <div className="py-12 text-center text-sm text-muted-foreground">{t('schema.needConnection')}</div> : !selectedDatabase ? <div className="py-12 text-center text-sm text-muted-foreground">{t('schema.pickDb')}</div> : loadingSchema ? <div className="py-12 text-center text-sm text-muted-foreground"><LoaderCircle className="mx-auto mb-2 size-5 animate-spin" />{t('schema.loading')}</div> : schemaError ? <p role="alert" className="py-12 text-center text-sm text-destructive">{schemaError}</p> : schemaData && <>
                {schemaData.tables.length === 0
                  ? <div className="py-12 text-center text-sm text-muted-foreground">{t('schema.empty')}</div>
                  : <>
                    <div className="h-[60vh] min-h-[420px] overflow-hidden rounded-xl border">
                      <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">{t('schema.canvasLoading')}</div>}>
                        <SchemaCanvas key={selectedDatabase} tables={schemaData.tables} relationships={schemaData.relationships} dark={dark} onOpenTable={openTable} />
                      </Suspense>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{t('schema.hint')}</p>
                  </>}
              </>}
            </div>}

            {activeTab === 'SQL' && <div className="mx-auto flex h-full w-full max-w-6xl flex-col">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-muted-foreground">{t('sql.eyebrow')}</p><h1 className="mt-1 text-xl font-semibold">{t('sql.title')}</h1></div><div className="flex items-center gap-2"><span className="max-w-48 truncate rounded-md bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">{selectedDatabase || t('sql.noDb')}</span><Button onClick={executeQuery} disabled={!connection || runningQuery}><Play className="mr-2 size-3.5 fill-current" />{runningQuery ? t('sql.running') : t('sql.run')}</Button></div></div>
              <div className="min-h-[320px] flex-1 overflow-hidden border shadow-sm">
                <Suspense fallback={<div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">{t('editor.loading')}</div>}>
                  <SqlEditor
                    value={sql}
                    onChange={setSql}
                    onRun={() => void executeQuery()}
                    tables={tables}
                    databases={connection?.databases || []}
                    columns={schemaColumns}
                    database={selectedDatabase}
                    dark={dark}
                    fontSize={editorFontSize}
                    lineNumbers={showLineNumbers}
                  />
                </Suspense>
              </div><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{t('sql.hints')}</span><span className="flex items-center gap-3"><span>{t('sql.chars', { count: sql.length })}</span><button onClick={() => { setSql(''); setQueryResult(null); setQueryError('') }} className="font-medium text-primary hover:underline">{t('sql.clear')}</button></span></div>
              {(queryError || queryResult) && <section className="mt-6 border-t pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-sm font-medium"><Terminal className="size-4 text-primary" />{t('sql.results')}{queryResult?.results?.length > 1 && <span className="text-xs font-normal text-muted-foreground">{t('sql.statements', { count: queryResult.statementCount })}</span>}</div>{currentResult && <span className="text-xs text-muted-foreground">{currentResult.message || t('sql.rows', { count: currentResult.affectedRows })}{currentResult.truncated ? t('sql.first500') : ''}</span>}</div>
                {queryResult?.results?.length > 1 && <div className="mt-3 flex gap-1 overflow-x-auto">{queryResult.results.map((result, index) => <button key={index} onClick={() => setActiveResult(index)} className={`rounded-md px-2.5 py-1 text-xs ${activeResult === index ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-accent'}`}>{t('sql.resultN', { n: index + 1 })}</button>)}</div>}
                {queryError ? <p className="mt-3 text-sm text-destructive">{queryError}</p> : currentResult?.columns?.length ? (currentResult.rows.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{t('sql.noRows')}</p> : <div className="mt-3 max-h-72 overflow-auto"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-background"><tr className="border-b">{currentResult.columns.map((column) => <th key={column} className="whitespace-nowrap px-3 py-2 font-semibold text-muted-foreground">{column}</th>)}</tr></thead><tbody className="divide-y divide-border/60">{currentResult.rows.map((row, index) => <tr key={index}>{currentResult.columns.map((column) => <td key={column} className="max-w-72 truncate px-3 py-2 font-mono">{row[column] == null ? <span className="text-muted-foreground italic">NULL</span> : typeof row[column] === 'object' ? JSON.stringify(row[column]) : String(row[column])}</td>)}</tr>)}</tbody></table></div>) : currentResult && <p className="mt-3 text-sm text-emerald-600">{currentResult.message || t('sql.success')}</p>}
              </section>}
            </div>}
          </div>
        </main>
      {showConnectionForm && (
        <ConnectDialog
          credentials={credentials}
          setCredentials={setCredentials}
          connectionError={connectionError}
          connecting={connecting}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          recentConnections={recentConnections}
          onRemoveRecent={removeRecent}
          showXamppPreset={Boolean(xamppStatus?.installed)}
          showLocalPreset={Boolean(managedDatabase?.installed && managedDatabase.port)}
          localPort={managedDatabase?.port}
          onSubmit={connectDatabase}
          onClose={() => setShowConnectionForm(false)}
        />
      )}
    </div>
  )
}

export default App
