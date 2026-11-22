import type { ConnectionIdentity } from '@rastrokit/domain'
import { AppError, Either } from '@rastrokit/shared/helpers'

export type { ConnectionIdentity } from '@rastrokit/domain'

export type ConnectionCredentialPayload = Readonly<
  Record<string, string | number | boolean>
>

export interface AuthenticationResult {
  identity: ConnectionIdentity
  credentials: ConnectionCredentialPayload
}

export interface DataSourceAuthenticationInput {
  configuration: ConnectionCredentialPayload
  credentials: ConnectionCredentialPayload
}

export interface IAuthenticationStrategy<
  AuthCredentials = DataSourceAuthenticationInput,
> {
  authenticate(
    credentials: AuthCredentials,
  ): Promise<Either<AppError, AuthenticationResult>>
}
