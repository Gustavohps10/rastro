import { ElectronAPI } from '@electron-toolkit/preload'

import type { IHostBridge } from '@rastrokit/application'

declare global {
  interface Window {
    electron: ElectronAPI
    api: IHostBridge
  }
}
