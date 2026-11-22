import type { AddonConnectionAuthenticator } from '@rastrokit/application'
import type { ConnectionProfileDescriptor } from '@rastrokit/domain'
import type { AppError, Either } from '@rastrokit/shared/helpers'

import type { AddonSettingsSchema } from '../settings/AddonSettingsSchema'

/** Requires the manifest capability `auth`; profiles are independent of datasources. */
export interface IAddonConnectionsContributionAPI {
  registerProfiles(
    profiles: readonly ConnectionProfileDescriptor[],
  ): Either<AppError, void>
  unregisterProfiles(): void
  registerSchema(
    connectionProfileId: string,
    schema: AddonSettingsSchema,
  ): Either<AppError, void>
  unregisterSchema(connectionProfileId: string): void
  registerAuthenticator(
    authenticator: AddonConnectionAuthenticator,
  ): Either<AppError, void>
  unregisterAuthenticator(authProfileId: string): void
}
