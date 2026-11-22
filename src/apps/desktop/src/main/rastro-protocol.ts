import { realpath } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

export const RASTRO_PROTOCOL = 'rastro'
export const RASTRO_ASSET_BASE_URL = 'rastro://assets/'

export function getOAuthCallbackProtocol(isPackaged: boolean): string {
  if (isPackaged) return RASTRO_PROTOCOL
  return 'electron'
}

export type RastroDeepLink =
  { kind: 'activation'; key: string } | { kind: 'oauth'; url: URL }

export function parseRastroDeepLink(
  value: string,
  isPackaged = true,
): RastroDeepLink | undefined {
  if (!URL.canParse(value)) return undefined
  const url = new URL(value)
  if (url.username || url.password || url.port || url.hash) {
    return undefined
  }

  if (url.hostname === 'oauth' && url.pathname === '/callback') {
    if (url.protocol !== `${getOAuthCallbackProtocol(isPackaged)}:`) {
      return undefined
    }

    return { kind: 'oauth', url }
  }

  if (url.protocol !== `${RASTRO_PROTOCOL}:`) return undefined
  if (url.hostname !== 'activate') return undefined
  if (url.pathname !== '' && url.pathname !== '/') return undefined

  const key = url.searchParams.get('key')?.trim()
  if (!key) return undefined
  return { kind: 'activation', key }
}

export function findRastroDeepLink(
  commandLine: readonly string[],
  isPackaged = true,
): RastroDeepLink | undefined {
  for (const argument of commandLine) {
    const link = parseRastroDeepLink(argument, isPackaged)
    if (link) return link
  }

  return undefined
}

function getRastroAvatarFileName(url: URL): string | undefined {
  if (
    url.protocol !== `${RASTRO_PROTOCOL}:` ||
    url.host !== 'assets' ||
    url.username ||
    url.password
  ) {
    return undefined
  }

  const prefix = '/workspaces/avatars/'
  if (!url.pathname.startsWith(prefix)) return undefined

  const fileName = url.pathname.slice(prefix.length)
  if (!/^[a-z0-9-]+\.(png|jpe?g|gif|svg|webp)$/i.test(fileName)) {
    return undefined
  }

  return fileName
}

export async function resolveRastroAvatarUrl(
  userDataPath: string,
  requestUrl: string,
): Promise<URL | undefined> {
  if (!URL.canParse(requestUrl)) return undefined
  const filename = getRastroAvatarFileName(new URL(requestUrl))
  if (!filename) return undefined

  const directory = await realpath(
    join(userDataPath, 'workspaces', 'avatars'),
  ).catch(() => undefined)
  if (!directory) return undefined

  const file = await realpath(join(directory, filename)).catch(() => undefined)
  if (!file || dirname(file) !== directory) return undefined
  return pathToFileURL(file)
}
