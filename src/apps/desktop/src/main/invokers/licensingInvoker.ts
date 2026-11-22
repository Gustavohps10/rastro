import { ILicensingAPI } from '@rastrokit/application'
import { IRequest } from '@rastrokit/shared/transport'

import { IpcInvoker } from '@/main/adapters/IpcInvoker'

export const licensingInvoker: ILicensingAPI = {
  getStatus: () => IpcInvoker.invoke('LICENSING_GET_STATUS'),
  activate: (payload: IRequest<{ licenseKey: string }>) =>
    IpcInvoker.invoke('LICENSING_ACTIVATE', payload),
  refresh: () => IpcInvoker.invoke('LICENSING_REFRESH'),
  deactivate: () => IpcInvoker.invoke('LICENSING_DEACTIVATE'),
}
