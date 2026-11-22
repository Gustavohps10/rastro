import { randomUUID } from 'node:crypto'
import { readFileSync, renameSync, rmSync, watch, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { parseRastroDeepLink } from './rastro-protocol'

export function forwardDevOAuthCallback(directory: string, url: URL): void {
  const destination = join(directory, `oauth-callback-${randomUUID()}`)
  const staging = `${destination}.tmp`

  try {
    writeFileSync(staging, url.href, { flag: 'wx', mode: 0o600 })
    renameSync(staging, destination)
  } catch {
    rmSync(staging, { force: true })
    console.error(
      '[Rastro] Falha ao encaminhar o retorno OAuth para o desktop.',
    )
  }
}

export function watchDevOAuthCallbacks(
  directory: string,
  receive: (url: URL) => void,
): () => void {
  const watcher = watch(directory, { persistent: false }, (event, filename) => {
    if (event !== 'rename' || !filename) return

    if (
      !/^oauth-callback-[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/.test(
        filename,
      )
    ) {
      return
    }

    const path = join(directory, filename)
    let callback: string

    try {
      callback = readFileSync(path, 'utf8')
      rmSync(path)
    } catch {
      // The removal of a consumed file can emit another rename event.
      return
    }

    const link = parseRastroDeepLink(callback, false)
    if (link?.kind === 'oauth') receive(link.url)
  })

  watcher.on('error', () => {
    console.error('[Rastro] Falha ao monitorar retornos OAuth do desktop.')
  })

  return () => watcher.close()
}
