import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Dropdown({ value, onChange, options, label, direction = 'down', className }) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const rootRef = useRef(null)
  const listId = useId()
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const choose = (option) => {
    onChange(option.value)
    setOpen(false)
  }

  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))

  const onTriggerKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (!open && (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown')) {
      event.preventDefault()
      setHighlight(selectedIndex)
      setOpen(true)
      return
    }
    if (!open) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlight((current) => (current + 1) % options.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((current) => (current - 1 + options.length) % options.length)
    } else if ((event.key === 'Enter' || event.key === ' ') && highlight >= 0) {
      event.preventDefault()
      choose(options[highlight])
    } else if (event.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => {
          setHighlight(selectedIndex)
          setOpen((current) => !current)
        }}
        onKeyDown={onTriggerKeyDown}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="truncate">{selected?.label ?? ''}</span>
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className={cn(
            'absolute z-30 max-h-56 w-full overflow-auto rounded-lg border bg-popover py-1 shadow-lg',
            direction === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          )}
        >
          {options.map((option, index) => {
            const active = option.value === value
            return (
              <li key={option.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => choose(option)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground',
                    index === highlight && 'bg-accent',
                    active && 'font-medium text-primary',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {active && <Check className="size-4 shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
