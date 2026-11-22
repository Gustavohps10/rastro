import { AppError, Either } from '@rastrokit/shared/helpers'
import { IJobEvent } from '@rastrokit/shared/transport'

import { FileData } from '@/contracts/infra'

export interface IImportAddonUseCase {
  execute(
    fileData: FileData,
    onProgress?: (event: IJobEvent) => void,
  ): Promise<Either<AppError, void>>
}
