import { Workspace } from '@rastrokit/domain'
import { AppError, Either } from '@rastrokit/shared/helpers'

import {
  PagedResultDTO,
  PaginationOptionsDTO,
  WorkspaceFilterDTO,
} from '@/dtos'

export interface IWorkspacesRepository {
  create(workspace: Workspace): Promise<Either<AppError, void>>
  getById(id: string): Promise<Either<AppError, Workspace | undefined>>
  list(
    filter?: WorkspaceFilterDTO,
    pagination?: PaginationOptionsDTO,
  ): Promise<Either<AppError, PagedResultDTO<Workspace>>>
  update(workspace: Workspace): Promise<Either<AppError, void>>
  remove(id: string): Promise<Either<AppError, void>>
}
