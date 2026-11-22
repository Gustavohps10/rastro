import { ConnectionProfileDescriptor } from '@rastrokit/domain'
import { AppError, Either } from '@rastrokit/shared/helpers'

export type ConnectionSlotReservation = ConnectionProfileDescriptor & {
  reservationId: string
  workspaceId: string
  addonId: string
  connectionId: string
}

export type PersistedConnectionReservation = ConnectionSlotReservation & {
  status: 'pending' | 'confirmed' | 'released'
}

export type ConnectionReservationScope = {
  workspaceId: string
  addonId: string
  connectionProfileId: string
  connectionId: string
}

export interface IConnectionReservationRepository {
  reserveConnectionSlot(
    reservation: ConnectionSlotReservation,
  ): Promise<Either<AppError, void>>
  findConnectionReservation(
    scope: ConnectionReservationScope,
  ): Promise<Either<AppError, PersistedConnectionReservation | undefined>>
  releaseConnectionSlot(
    reservation: ConnectionSlotReservation,
  ): Promise<Either<AppError, void>>
  recoverPendingConnectionReservations(): Promise<Either<AppError, void>>
}
