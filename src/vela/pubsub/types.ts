import type {
  BitcraftEntities,
  Envelope_1,
  SystemEntities,
  UpdateEnvelope_1,
} from "../__generated__";

export type Envelope<T> = Omit<Envelope_1, "Entity"> & { Entity: T };
export type UpdateEnvelope<T> = Omit<
  UpdateEnvelope_1,
  "OldEntity" | "NewEntity"
> & { OldEntity: T; NewEntity: T };

export type TRedisChannels =
  | `bitcraft.${BitcraftEntities}.insert`
  | `bitcraft.${BitcraftEntities}.update`
  | `bitcraft.${BitcraftEntities}.delete`
  | `system.${SystemEntities}`;
