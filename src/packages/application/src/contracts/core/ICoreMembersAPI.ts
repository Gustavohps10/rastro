import type { AppError, Either } from '@rastrokit/shared/helpers'

import type { CoreConnectionScope, CoreMember } from './CoreContext'

export interface ICoreMembersAPI {
  getCurrentUser(
    scope: CoreConnectionScope,
  ): Promise<Either<AppError, CoreMember>>
}
