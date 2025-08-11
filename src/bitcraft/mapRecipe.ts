import type { CraftingRecipeDesc } from "@src/bindings";
import type { IBitcraftRecipe } from "@src/framework";

export function mapRecipe(item: CraftingRecipeDesc): IBitcraftRecipe {
  return {
    id: item.id,
    nameFormatString: item.name,
    buildingRequirement: item.buildingRequirement && {
      buildingType: item.buildingRequirement.buildingType,
      tier: item.buildingRequirement.tier,
    },
    levelRequirements: item.levelRequirements.map((x) => ({
      skillId: x.skillId,
      level: x.level,
    })),
    toolRequirements: item.toolRequirements.map((x) => ({
      toolType: x.toolType,
      level: x.level,
    })),
    consumedItemStacks: item.consumedItemStacks.map((x) => ({
      itemId: x.itemId,
      quantity: x.quantity,
    })),
    producedItemStacks: item.craftedItemStacks.map((x) => ({
      itemId: x.itemId,
      quantity: x.quantity,
    })),
    isPassive: item.isPassive,
    actionsRequired: item.actionsRequired,
  };
}
