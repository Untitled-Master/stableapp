// Regenerates the Windows installer icon from the app logo.
// Runs automatically before `npm run dist` (see the `predist` script).
import pngToIco from 'png-to-ico'
import { mkdirSync, writeFileSync } from 'node:fs'

mkdirSync(new URL('../build/', import.meta.url), { recursive: true })
writeFileSync(new URL('../build/icon.ico', import.meta.url), await pngToIco('public/Stable.png'))
console.log('build/icon.ico written')
