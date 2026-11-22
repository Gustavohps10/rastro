import { AppError, Either } from '@rastrokit/shared/helpers'
import { IJobEvent } from '@rastrokit/shared/transport'

export interface UpdateAddonInput {
  addonId: string
  downloadUrl: string
  expectedSha256?: string
}

export interface IUpdateAddonUseCase {
  execute(
    input: UpdateAddonInput,
    onProgress?: (event: IJobEvent) => void,
  ): Promise<Either<AppError, void>>
}
