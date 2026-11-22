import type { IEventsAPI } from '@rastrokit/application'
import type { ISystemEvents } from '@rastrokit/shared/transport'

export type AddonSystemEvents = Pick<
  ISystemEvents,
  | 'timer:start'
  | 'timer:pause'
  | 'timer:resume'
  | 'timer:stop'
  | 'timer:update'
  | 'workspace:changed'
  | 'addon:settings:saved'
>
export interface IAddonEventsAPI extends IEventsAPI<AddonSystemEvents> {}
