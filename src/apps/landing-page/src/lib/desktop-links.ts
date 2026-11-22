export function createOAuthDesktopCallbackUrl(
  query: string,
  isDevelopment: boolean,
): string {
  const scheme = isDevelopment ? 'electron' : 'rastro'
  const callback = new URL(`${scheme}://oauth/callback`)
  callback.search = query
  return callback.href
}

export function createDesktopActivationUrl(key: string): string {
  const activation = new URL('rastro://activate')
  activation.searchParams.set('key', key)
  return activation.href
}
