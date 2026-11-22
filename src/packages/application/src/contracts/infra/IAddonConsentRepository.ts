import { AppError, Either } from '@rastrokit/shared/helpers'

export interface IAddonConsentRepository {
  isApproved(fingerprint: string): Promise<Either<AppError, boolean>>
  approve(fingerprint: string): Promise<Either<AppError, void>>
}
