import { ILicensingFacade } from '@rastrokit/application'
import { createResponseViewModel } from '@rastrokit/shared/helpers'
import { IRequest } from '@rastrokit/shared/transport'
import {
  LicensingStatusViewModel,
  ViewModel,
} from '@rastrokit/shared/view-models'
import { IpcMainInvokeEvent } from 'electron'

import { HandlerBase } from './HandlerBase'

export class LicensingHandler implements HandlerBase<LicensingHandler> {
  constructor(private readonly licensingFacade: ILicensingFacade) {}

  async getStatus(): Promise<ViewModel<LicensingStatusViewModel>> {
    const result = await this.licensingFacade.getStatus()
    return createResponseViewModel(result)
  }

  async activate(
    event: IpcMainInvokeEvent,
    req: IRequest<{ licenseKey: string }>,
  ): Promise<ViewModel<LicensingStatusViewModel>> {
    let licenseKey = ''
    if (event && req && req.body && req.body.licenseKey) {
      licenseKey = req.body.licenseKey
    }
    const result = await this.licensingFacade.activateLicense(licenseKey)
    return createResponseViewModel(result)
  }

  async refresh(): Promise<ViewModel<LicensingStatusViewModel>> {
    const result = await this.licensingFacade.refreshLicense()
    return createResponseViewModel(result)
  }

  async deactivate(): Promise<ViewModel<LicensingStatusViewModel>> {
    const result = await this.licensingFacade.deactivateLicense()
    return createResponseViewModel(result)
  }
}
