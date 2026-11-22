import { OfflineAuthorizationClaims } from '@rastrokit/domain'
import { AppError, Either } from '@rastrokit/shared/helpers'

export interface IOfflineAuthorizationVerifier {
  verify(token: string): Promise<Either<AppError, OfflineAuthorizationClaims>>
}
