import type { AppError, Either } from '@rastrokit/shared/helpers'

import type { IAnalyticsSource } from '../../../analytics'

/** A single analytics source owned by the registering addon. */
export interface IAddonAnalyticsAPI {
  register(source: IAnalyticsSource): Either<AppError, void>
  unregister(): void
}
