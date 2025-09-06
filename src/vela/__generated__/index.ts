// Exports
export * from "./BitcraftActionLogState";
export * from "./BitcraftAuctionListingState";
export * from "./BitcraftBuildingDesc";
export * from "./BitcraftBuildingState";
export * from "./BitcraftChatMessage";
export * from "./BitcraftClaimState";
export * from "./BitcraftEmpireNodeSiegeState";
export * from "./BitcraftEmpireNodeState";
export * from "./BitcraftEmpireState";
export * from "./BitcraftInventoryState";
export * from "./BitcraftItem";
export * from "./BitcraftItemList";
export * from "./BitcraftLocationState";
export * from "./BitcraftProgressiveAction";
export * from "./BitcraftPublicProgressiveAction";
export * from "./BitcraftRecipe";
export * from "./BitcraftUserModerationState";
export * from "./BitcraftUserState";
export * from "./BitcraftUsernameState";
export * from "./Envelope_1";
export * from "./HeartbeatEvent";
export * from "./UpdateEnvelope_1";

import type { BitcraftActionLogState } from "./BitcraftActionLogState";
import type { BitcraftAuctionListingState } from "./BitcraftAuctionListingState";
import type { BitcraftBuildingDesc } from "./BitcraftBuildingDesc";
import type { BitcraftBuildingState } from "./BitcraftBuildingState";
import type { BitcraftChatMessage } from "./BitcraftChatMessage";
import type { BitcraftClaimState } from "./BitcraftClaimState";
import type { BitcraftEmpireNodeSiegeState } from "./BitcraftEmpireNodeSiegeState";
import type { BitcraftEmpireNodeState } from "./BitcraftEmpireNodeState";
import type { BitcraftEmpireState } from "./BitcraftEmpireState";
import type { BitcraftInventoryState } from "./BitcraftInventoryState";
import type { BitcraftItem } from "./BitcraftItem";
import type { BitcraftItemList } from "./BitcraftItemList";
import type { BitcraftLocationState } from "./BitcraftLocationState";
import type { BitcraftProgressiveAction } from "./BitcraftProgressiveAction";
import type { BitcraftPublicProgressiveAction } from "./BitcraftPublicProgressiveAction";
import type { BitcraftRecipe } from "./BitcraftRecipe";
import type { BitcraftUserModerationState } from "./BitcraftUserModerationState";
import type { BitcraftUserState } from "./BitcraftUserState";
import type { BitcraftUsernameState } from "./BitcraftUsernameState";
import type { HeartbeatEvent } from "./HeartbeatEvent";

export enum BitcraftEntities {
  BitcraftActionLogState = "BitcraftActionLogState",
  BitcraftAuctionListingState = "BitcraftAuctionListingState",
  BitcraftBuildingDesc = "BitcraftBuildingDesc",
  BitcraftBuildingState = "BitcraftBuildingState",
  BitcraftChatMessage = "BitcraftChatMessage",
  BitcraftClaimState = "BitcraftClaimState",
  BitcraftEmpireNodeSiegeState = "BitcraftEmpireNodeSiegeState",
  BitcraftEmpireNodeState = "BitcraftEmpireNodeState",
  BitcraftEmpireState = "BitcraftEmpireState",
  BitcraftInventoryState = "BitcraftInventoryState",
  BitcraftItem = "BitcraftItem",
  BitcraftItemList = "BitcraftItemList",
  BitcraftLocationState = "BitcraftLocationState",
  BitcraftProgressiveAction = "BitcraftProgressiveAction",
  BitcraftPublicProgressiveAction = "BitcraftPublicProgressiveAction",
  BitcraftRecipe = "BitcraftRecipe",
  BitcraftUserModerationState = "BitcraftUserModerationState",
  BitcraftUserState = "BitcraftUserState",
  BitcraftUsernameState = "BitcraftUsernameState",
}

export enum SystemEntities {
  HeartbeatEvent = "HeartbeatEvent",
}

// All entity map - use this for event subscriptions
export type TAllEntityMap = {
  BitcraftActionLogState: BitcraftActionLogState;
  BitcraftAuctionListingState: BitcraftAuctionListingState;
  BitcraftBuildingDesc: BitcraftBuildingDesc;
  BitcraftBuildingState: BitcraftBuildingState;
  BitcraftChatMessage: BitcraftChatMessage;
  BitcraftClaimState: BitcraftClaimState;
  BitcraftEmpireNodeSiegeState: BitcraftEmpireNodeSiegeState;
  BitcraftEmpireNodeState: BitcraftEmpireNodeState;
  BitcraftEmpireState: BitcraftEmpireState;
  BitcraftInventoryState: BitcraftInventoryState;
  BitcraftItem: BitcraftItem;
  BitcraftItemList: BitcraftItemList;
  BitcraftLocationState: BitcraftLocationState;
  BitcraftProgressiveAction: BitcraftProgressiveAction;
  BitcraftPublicProgressiveAction: BitcraftPublicProgressiveAction;
  BitcraftRecipe: BitcraftRecipe;
  BitcraftUserModerationState: BitcraftUserModerationState;
  BitcraftUserState: BitcraftUserState;
  BitcraftUsernameState: BitcraftUsernameState;
  HeartbeatEvent: HeartbeatEvent;
};

// Entities are by default partitioned by region
export type TRegionalEntityMap = {
  BitcraftActionLogState: BitcraftActionLogState;
  BitcraftBuildingDesc: BitcraftBuildingDesc;
  BitcraftBuildingState: BitcraftBuildingState;
  BitcraftChatMessage: BitcraftChatMessage;
  BitcraftEmpireNodeSiegeState: BitcraftEmpireNodeSiegeState;
  BitcraftEmpireNodeState: BitcraftEmpireNodeState;
  BitcraftInventoryState: BitcraftInventoryState;
  BitcraftLocationState: BitcraftLocationState;
  BitcraftProgressiveAction: BitcraftProgressiveAction;
  BitcraftPublicProgressiveAction: BitcraftPublicProgressiveAction;
  BitcraftUserState: BitcraftUserState;
  HeartbeatEvent: HeartbeatEvent;
};

// These entities are global. There is some nuance to how these caches work,
// they are NOT cleared by the event gateways on restart to avoid them interfering with each other.
export type TGlobalEntityMap = {
  BitcraftAuctionListingState: BitcraftAuctionListingState;
  BitcraftClaimState: BitcraftClaimState;
  BitcraftEmpireState: BitcraftEmpireState;
  BitcraftItem: BitcraftItem;
  BitcraftItemList: BitcraftItemList;
  BitcraftRecipe: BitcraftRecipe;
  BitcraftUserModerationState: BitcraftUserModerationState;
  BitcraftUsernameState: BitcraftUsernameState;
};
