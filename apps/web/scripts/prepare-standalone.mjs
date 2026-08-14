import { access, cp, readdir, readlink, rename, rm, symlink } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url))
const webDirectory = path.resolve(scriptsDirectory, '..')
const nextDirectory = path.join(webDirectory, '.next')
const standaloneDirectory = path.join(nextDirectory, 'standalone')
const nestedApplication = path.join(standaloneDirectory, 'apps', 'web')
const hostingerOutput = path.join(webDirectory, '.hostinger-output')

async function makeSymlinksPortable(directory) {
  const entries = await readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)

    if (entry.isSymbolicLink()) {
      const target = await readlink(entryPath)

      if (path.isAbsolute(target) && target.startsWith(`${standaloneDirectory}${path.sep}`)) {
        const portableTarget = path.join(
          hostingerOutput,
          path.relative(standaloneDirectory, target),
        )
        const relativeTarget = path.relative(path.dirname(entryPath), portableTarget)

        await rm(entryPath)
        await symlink(relativeTarget, entryPath)
      }

      continue
    }

    if (entry.isDirectory()) await makeSymlinksPortable(entryPath)
  }
}

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

// Hostinger copies the configured `.next` output directory into its runtime
// root. Promote the portable standalone contents so server.js, node_modules,
// and the nested build directory arrive together at that root.
await rm(hostingerOutput, { recursive: true, force: true })
await cp(standaloneDirectory, hostingerOutput, {
  recursive: true,
  force: true,
})
await makeSymlinksPortable(hostingerOutput)
await rm(nextDirectory, { recursive: true, force: true })
await rename(hostingerOutput, nextDirectory)
