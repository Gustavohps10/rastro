import type { ICoreAPI } from '@rastrokit/application'

import type { IAddonContributionsAPI } from './contributions'
import type { IAddonHostAPI } from './host'
import type { IHttpClient } from './host/http'

/** Public addon surface, grouped by responsibility. */
export interface AddonContext {
  readonly core: ICoreAPI
  readonly contributions: IAddonContributionsAPI
  readonly host: IAddonHostAPI
  readonly http: IHttpClient
}
