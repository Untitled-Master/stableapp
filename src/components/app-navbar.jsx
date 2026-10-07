import { ChevronRight, Maximize2, Minus, Moon, Plus, Sun, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MySQL } from '@/components/mysql-logo'
import { useTranslation } from 'react-i18next'

export function AppNavbar({ dark, onToggleDark, onAddConnection, page = 'Overview' }) {
  const { t } = useTranslation()
  const noDrag = { WebkitAppRegion: 'no-drag' }

  return (
    <header
      className="flex h-12 shrink-0 items-center px-5"
      style={{ WebkitAppRegion: 'drag' }}
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="flex size-6 items-center justify-center rounded-md bg-[#00758f] p-1"><MySQL className="size-4" /></span>
        <span className="font-semibold tracking-tight">MySQL</span>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">{page}</span>
      </div>
      <div className="ml-auto flex items-center" style={noDrag}>
        <Button size="sm" variant="outline" className="mr-2" onClick={onAddConnection}>
          <Plus className="mr-1.5 size-3.5" /> {t('navbar.addConnection')}
        </Button>
        <Button size="icon" variant="ghost" onClick={onToggleDark} title={t('navbar.toggleTheme')}>
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <Button size="icon" variant="ghost" title={t('navbar.minimize')} onClick={() => window.windowControls?.minimize()}>
          <Minus className="size-4" />
        </Button>
        <Button size="icon" variant="ghost" title={t('navbar.maximize')} onClick={() => window.windowControls?.maximize()}>
          <Maximize2 className="size-4" />
        </Button>
        <Button size="icon" variant="ghost" className="hover:bg-destructive hover:text-white" title={t('navbar.close')} onClick={() => window.windowControls?.close()}>
          <X className="size-4" />
        </Button>
      </div>
    </header>
  )
}
