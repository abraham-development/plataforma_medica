import { access, cp, readdir, readlink, rm, symlink } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url))
const webDirectory = path.resolve(scriptsDirectory, '..')
const nextDirectory = path.join(webDirectory, '.next')
const standaloneDirectory = path.join(nextDirectory, 'standalone')
const nestedApplication = path.join(standaloneDirectory, 'apps', 'web')

async function makeSymlinksPortable(directory) {
  const entries = await readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)

    if (entry.isSymbolicLink()) {
      const target = await readlink(entryPath)

      if (path.isAbsolute(target) && target.startsWith(`${standaloneDirectory}${path.sep}`)) {
        const relativeTarget = path.relative(path.dirname(entryPath), target)

        await rm(entryPath)
        await symlink(relativeTarget, entryPath)
      }

      continue
    }

    if (entry.isDirectory()) await makeSymlinksPortable(entryPath)
  }
}

await access(path.join(nestedApplication, 'server.js'))

// Next.js preserves the monorepo path inside standalone output. The container
// expects server.js at the artifact root, so overlay the web package there.
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
await makeSymlinksPortable(standaloneDirectory)
