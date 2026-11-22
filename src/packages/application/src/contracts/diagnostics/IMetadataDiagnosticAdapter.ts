import type { AppError, Either } from '@rastrokit/shared/helpers'

import type { DiagnosticCheckResult } from './DiagnosticCheck'
import type { DiagnosticStorageItem } from './DiagnosticMeasurement'

export interface IMetadataDiagnosticAdapter {
  checkStorage(): Promise<Either<AppError, DiagnosticStorageItem>>
  readProbe(): Promise<Either<AppError, DiagnosticCheckResult>>
}
