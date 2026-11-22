import type { ConnectionIdentity } from '@rastrokit/domain'

import type { MemberDTO } from '@/dtos/MemberDTO'

export interface ConnectionResultDTO {
  identity?: ConnectionIdentity
  member?: MemberDTO
}
