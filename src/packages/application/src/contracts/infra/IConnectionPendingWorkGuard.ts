import { AppError, Either } from '@rastrokit/shared/helpers'

export interface IConnectionPendingWorkGuard {
  withNoPendingWrites<T>(
    workspaceId: string,
    connectionInstanceIds: readonly string[],
    operation: () => Promise<Either<AppError, T>>,
  ): Promise<Either<AppError, T>>
}
