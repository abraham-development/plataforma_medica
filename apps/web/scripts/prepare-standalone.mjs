import { access, cp, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url))
const webDirectory = path.resolve(scriptsDirectory, '..')
const nextDirectory = path.join(webDirectory, '.next')
const standaloneDirectory = path.join(nextDirectory, 'standalone')
const nestedApplication = path.join(standaloneDirectory, 'apps', 'web')

await access(path.join(nestedApplication, 'server.js'))

// Next.js preserves the monorepo path inside standalone output. Hostinger
// expects server.js at the output root, so overlay the web package there.
await cp(nestedApplication, standaloneDirectory, { recursive: true, force: true })
await cp(path.join(nextDirectory, 'static'), path.join(standaloneDirectory, '.next', 'static'), {
  recursive: true,
  force: true,
})
await cp(path.join(webDirectory, 'public'), path.join(standaloneDirectory, 'public'), {
  recursive: true,
  force: true,
})
await rm(path.join(standaloneDirectory, 'apps'), { recursive: true, force: true })
