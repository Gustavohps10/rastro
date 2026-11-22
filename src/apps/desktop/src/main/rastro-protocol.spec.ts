import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { HardDiskStorage } from '@rastrokit/adapters/tools'
import { describe, expect, it } from 'vitest'

import {
  findRastroDeepLink,
  parseRastroDeepLink,
  RASTRO_ASSET_BASE_URL,
  resolveRastroAvatarUrl,
} from './rastro-protocol'

describe('Rastro desktop protocol', () => {
  it('encaminha o retorno do navegador à instância em desenvolvimento', () => {
    const url = 'electron://oauth/callback?code=dev-code&state=dev-state'
    expect(findRastroDeepLink(['electron.exe', url], false)).toEqual({
      kind: 'oauth',
      url: new URL(url),
    })
    expect(parseRastroDeepLink(url, true)).toBeUndefined()
  })

  it('identifica a ativação ao receber argumentos do sistema', () => {
    expect(
      findRastroDeepLink([
        'app.exe',
        '--trace',
        'rastro://activate?key=abc%2B123',
      ]),
    ).toEqual({ kind: 'activation', key: 'abc+123' })
  })

  it('preserva o retorno OAuth', () => {
    const url = 'rastro://oauth/callback?code=abc&state=xyz'
    expect(parseRastroDeepLink(url)).toEqual({
      kind: 'oauth',
      url: new URL(url),
    })
  })

  it.each([
    'other-app://oauth/callback?code=abc&state=xyz',
    'unregistered://activate?key=abc',
    'rastro://assets/workspaces/avatars/avatar.png',
    'rastro://activate-other?key=abc',
    'rastro://activate?key=%20',
  ])('ignora links fora das rotas válidas: %s', (url) => {
    expect(parseRastroDeepLink(url)).toBeUndefined()
  })

  it('resolve a URL emitida pelo armazenamento para um avatar existente', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'rastro-avatar-'))
    const path = 'workspaces/avatars/avatar.webp'
    const file = join(directory, path)

    try {
      await mkdir(join(directory, 'workspaces', 'avatars'), { recursive: true })
      await writeFile(file, 'avatar')
      const storage = new HardDiskStorage(directory, RASTRO_ASSET_BASE_URL)
      const url = storage.getPublicUrl(path)

      expect(url).toBe('rastro://assets/workspaces/avatars/avatar.webp')
      const resolved = await resolveRastroAvatarUrl(
        directory,
        `${url}?buster=1`,
      )
      expect(resolved && fileURLToPath(resolved)).toBe(file)
      expect(
        await resolveRastroAvatarUrl(directory, 'rastro://assets/private.png'),
      ).toBeUndefined()
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
