import {
  IMetadataPullUseCase,
  MetadataDTO,
  PullMetadataInput,
} from '@rastrokit/application'
import {
  AppError,
  createResponseViewModel,
  Either,
} from '@rastrokit/shared/helpers'
import { IRequest } from '@rastrokit/shared/transport'
import { MetadataViewModel, ViewModel } from '@rastrokit/shared/view-models'

import { HandlerBase } from '@/main/handlers/HandlerBase'

export class MetadataHandler implements HandlerBase<MetadataHandler> {
  constructor(private readonly metadataPullService: IMetadataPullUseCase) {}

  public async pull(
    _event: Electron.IpcMainInvokeEvent,
    { body }: IRequest<PullMetadataInput>,
  ): Promise<ViewModel<MetadataViewModel>> {
    const result: Either<AppError, MetadataDTO> =
      await this.metadataPullService.execute(body)

    return createResponseViewModel(result)
  }
}
