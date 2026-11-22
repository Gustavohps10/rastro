import type {
  ConnectionAuthorizationRecord,
  DataSourceConnection,
} from '@rastrokit/domain'
import { AppError, Either } from '@rastrokit/shared/helpers'

const PRIMARY_AUTHORIZATION_ROLE = 'primary'

export function selectPrimaryAuthorization(
  connection: DataSourceConnection,
): Either<AppError, ConnectionAuthorizationRecord> {
  const active = connection.authorizations.filter(
    (candidate) =>
      candidate.authorizationRole === PRIMARY_AUTHORIZATION_ROLE &&
      candidate.status === 'active',
  )
  if (active.length > 1)
    return Either.failure(
      AppError.Unauthorized('CONNECTION_AUTHORIZATION_AMBIGUOUS'),
    )
  const [selected] = active
  if (selected === undefined)
    return Either.failure(
      AppError.Unauthorized('CONNECTION_AUTHORIZATION_MISSING'),
    )
  return Either.success(selected)
}
