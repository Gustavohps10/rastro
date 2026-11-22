import { describe, expect, it } from 'vitest'

import {
  createDesktopActivationUrl,
  createOAuthDesktopCallbackUrl,
} from './desktop-links'

describe('Rastro desktop links', () => {
  it('abre o Electron no ambiente de desenvolvimento', () => {
    expect(createOAuthDesktopCallbackUrl('state=dev', true)).toBe(
      'electron://oauth/callback?state=dev',
    )
  })

  it('preserva os parâmetros do retorno OAuth', () => {
    const query = new URLSearchParams({
      code: 'code+with&symbols',
      state: 'state/value',
    }).toString()

    const result = new URL(createOAuthDesktopCallbackUrl(query, false))
    expect(result.protocol).toBe('rastro:')
    expect(result.host).toBe('oauth')
    expect(result.pathname).toBe('/callback')
    expect(result.searchParams.get('code')).toBe('code+with&symbols')
    expect(result.searchParams.get('state')).toBe('state/value')
  })

  it('não acrescenta uma query vazia', () => {
    expect(createOAuthDesktopCallbackUrl('', false)).toBe(
      'rastro://oauth/callback',
    )
  })

  it('codifica a chave de ativação sem criar outros parâmetros', () => {
    const result = new URL(createDesktopActivationUrl('key+with&symbols'))
    expect(result.protocol).toBe('rastro:')
    expect(result.host).toBe('activate')
    expect(result.searchParams.get('key')).toBe('key+with&symbols')
    expect(result.searchParams.size).toBe(1)
  })
})
