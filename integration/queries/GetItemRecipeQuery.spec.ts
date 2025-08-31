import GetItemRecipeQuery from "@src/application/queries/bitcraft/GetItemRecipeQuery";
import { describe, expect, it } from "vitest";

describe("GetItemRecipeQuery", () => {
  it("Correctly computes the recipe nodes for T3 plank", async () => {
    const query = new GetItemRecipeQuery({ itemId: "3020003", quantity: 25 });
    const result = await query.execute();

    expect(result).toEqual({
      recipe: {
        itemId: "3020003",
        item: {
          name: "Sturdy Plank",
          tier: 3,
        },
        quantity: 25,
        recipePicker: {
          "Treat Sturdy Plank Into Sturdy Stripped Wood": "302009",
        },
        recipes: {
          "302009": [
            {
              itemId: 1103116665,
              item: {
                name: "Sturdy Stripped Wood",
                tier: 3,
              },
              quantity: 50,
              recipePicker: {
                "Saw Sturdy Wood Log": "1859292277",
              },
              recipes: {
                "1859292277": [
                  {
                    itemId: 3010001,
                    item: {
                      name: "Sturdy Wood Log",
                      tier: 3,
                    },
                    quantity: 150,
                    recipePicker: {},
                    recipes: {},
                  },
                ],
              },
            },
            {
              itemId: 1763886534,
              item: {
                name: "Woodworking Sandpaper",
                tier: 0,
              },
              quantity: 25,
              recipePicker: {},
              recipes: {},
            },
          ],
        },
      },
    });
  });
  // todo support item lists
  // todo support passive crafting steps
});
