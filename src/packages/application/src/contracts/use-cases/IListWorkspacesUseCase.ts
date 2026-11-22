import { AppError, Either } from '@rastrokit/shared/helpers'

import {
  PagedResultDTO,
  PaginationOptionsDTO,
  WorkspaceDTO,
  WorkspaceFilterDTO,
} from '@/dtos'

export interface ListWorkspacesOptions {
  filter?: WorkspaceFilterDTO
  pagination?: PaginationOptionsDTO
}

export interface IListWorkspacesUseCase {
  execute(
    options?: ListWorkspacesOptions,
  ): Promise<Either<AppError, PagedResultDTO<WorkspaceDTO>>>
}
