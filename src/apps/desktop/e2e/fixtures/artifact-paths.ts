import { join, resolve } from 'node:path'

export const temporaryRoot = resolve(
  import.meta.dirname,
  '../../../../../.temps',
)
export const playwrightRoot = join(temporaryRoot, 'playwright')
export const electronUserDataRoot = join(playwrightRoot, 'electron-user-data')

export function getElectronUserDataPath(workerIndex: number): string {
  return join(electronUserDataRoot, `worker-${workerIndex}`)
}
