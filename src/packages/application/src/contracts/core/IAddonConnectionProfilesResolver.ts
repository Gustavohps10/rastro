import type { ConnectionProfileDescriptor } from '@rastrokit/domain'
import type { AppError, Either } from '@rastrokit/shared/helpers'

import type { AddonSettingsSchema } from '../host/IHostBridge'

export interface IAddonConnectionProfilesResolver {
  getConnectionSchema(
    addonId: string,
    connectionProfileId: string,
  ): Promise<Either<AppError, AddonSettingsSchema>>
  getConnectionProfiles(
    addonId: string,
  ): Promise<Either<AppError, readonly ConnectionProfileDescriptor[]>>
}

export interface IAddonConnectionProfilesRegistry extends IAddonConnectionProfilesResolver {
  registerProfiles(
    addonId: string,
    profiles: readonly ConnectionProfileDescriptor[],
  ): void
  unregisterProfiles(addonId: string): void
  registerSchema(
    addonId: string,
    connectionProfileId: string,
    schema: AddonSettingsSchema,
  ): Either<AppError, void>
  unregisterSchema(addonId: string, connectionProfileId: string): void
}
