import type { PublicProgressiveActionState } from "@src/bindings";
import type { IBitcraftProgressiveActionState } from "@src/framework";

export function mapPublicProgressiveActionState(
  action: PublicProgressiveActionState
): IBitcraftProgressiveActionState {
  return {
    id: action.entityId.toString(),
    buildingEntityId: action.buildingEntityId.toString(),
    ownerEntityId: action.ownerEntityId.toString(),
  };
}
