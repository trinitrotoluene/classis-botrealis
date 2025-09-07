import { db } from "@src/database";
import type { TrackedInventoriesId } from "@src/database/__generated__/public/TrackedInventories";
import { CommandBase } from "@src/framework";

type Args = { id: string };
type Response = object;

export default class DeleteInventoryLinkCommand extends CommandBase<
  Args,
  Response
> {
  execute() {
    return db
      .deleteFrom("tracked_inventories")
      .where("id", "=", this.args.id as TrackedInventoriesId)
      .execute();
  }
}
