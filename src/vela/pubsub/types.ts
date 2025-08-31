import type { BitcraftEntities, SystemEntities } from "../__generated__";

export interface Envelope<T> {
  Version: "V1";
  Module: string;
  Entity: T;
}

export interface UpdateEnvelope<T> {
  Version: "V1";
  Module: string;
  OldEntity: T;
  NewEntity: T;
}

export type TRedisChannels =
  | `bitcraft.${BitcraftEntities}.insert`
  | `bitcraft.${BitcraftEntities}.update`
  | `bitcraft.${BitcraftEntities}.delete`
  | `system.${SystemEntities}`;
