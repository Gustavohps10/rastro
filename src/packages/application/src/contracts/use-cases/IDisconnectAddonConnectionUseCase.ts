import type { AppError, Either } from '@rastrokit/shared/helpers'

export interface DisconnectAddonConnectionInput {
  workspaceId: string
  connectionInstanceId: string
  addonId?: string
}

export interface IDisconnectAddonConnectionUseCase {
  execute(
    input: DisconnectAddonConnectionInput,
  ): Promise<Either<AppError, void>>
}
