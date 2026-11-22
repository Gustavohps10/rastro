import { AppError, Either } from '@rastrokit/shared/helpers'

import { TimeEntryPullCheckpointDTO, TimeEntryPullPageDTO } from '@/dtos'

export type PullTimeEntriesInput = {
  workspaceId: string
  connectionInstanceId: string
  checkpoint: TimeEntryPullCheckpointDTO
  batch: number
}

export interface ITimeEntriesPullUseCase {
  execute(
    input: PullTimeEntriesInput,
  ): Promise<Either<AppError, TimeEntryPullPageDTO>>
}
