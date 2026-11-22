import { IHeadersAPI } from '@rastrokit/application'
import { IHeaders } from '@rastrokit/shared/transport'

import { IpcInvoker } from '@/main/adapters/IpcInvoker'

export const headersInvoker: IHeadersAPI = {
  setDefaultHeaders: (headers: IHeaders): void =>
    IpcInvoker.setDefaultHeaders(headers),
  getDefaultHeaders: (): IHeaders => IpcInvoker.getDefaultHeaders(),
}
