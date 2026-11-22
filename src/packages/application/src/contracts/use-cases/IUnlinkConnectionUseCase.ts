import { AppError, Either } from '@rastrokit/shared/helpers'

import { WorkspaceDTO } from '@/dtos'

export type UnlinkConnectionInput = {
  workspaceId: string
  connectionInstanceId: string
  addonId?: string
}

export interface IUnlinkConnectionUseCase {
  execute(input: UnlinkConnectionInput): Promise<Either<AppError, WorkspaceDTO>>
}
