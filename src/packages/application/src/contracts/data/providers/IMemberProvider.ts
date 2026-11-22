import { AppError, Either } from '@rastrokit/shared/helpers'

import { MemberDTO, PagedResultDTO, PaginationOptionsDTO } from '@/dtos'

export interface IMemberProvider {
  getCurrentUser(): Promise<Either<AppError, MemberDTO | null>>
  findById(id: string): Promise<Either<AppError, MemberDTO | null>>
  findByCredentials(
    login: string,
    password: string,
  ): Promise<Either<AppError, MemberDTO>>
  findAll(
    pagination?: PaginationOptionsDTO,
  ): Promise<Either<AppError, PagedResultDTO<MemberDTO>>>
}
