import { db } from "@src/database";
import type { ItemsId } from "@src/database/__generated__/public/Items";
import { type IBitcraftItemDeleted } from "@src/framework";

export async function onItemDeleted(event: IBitcraftItemDeleted) {
  const { id } = event;
  await db
    .deleteFrom("items")
    .where("id", "=", id.toString() as ItemsId)
    .executeTakeFirst();
}
