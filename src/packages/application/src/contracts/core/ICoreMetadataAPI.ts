import type { AppError, Either } from '@rastrokit/shared/helpers'

import type {
  CoreConnectionScope,
  CoreMetadata,
  LocalMetadataSnapshot,
} from './CoreContext'

export interface ICoreMetadataAPI {
  getLocal(
    workspaceId: string,
  ): Promise<Either<AppError, LocalMetadataSnapshot>>
  get(scope: CoreConnectionScope): Promise<Either<AppError, CoreMetadata>>
}
