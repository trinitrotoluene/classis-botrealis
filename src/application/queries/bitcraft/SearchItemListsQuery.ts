import { CommandBase } from "@src/framework";
import { CacheClient } from "@src/vela";
interface Args {
  searchString: string;
}

type Response = Array<{ name: string; id: string }>;

export default class SearchItemListsQuery extends CommandBase<Args, Response> {
  async execute() {
    const itemLists = await CacheClient.getAllGlobal("BitcraftItemList");

    const matchedItems = itemLists
      .values()
      .filter((x) => x.Name.toLowerCase().includes(this.args.searchString));

    return matchedItems
      .map((itemList) => ({
        id: itemList.Id,
        name: itemList.Name,
      }))
      .toArray();
  }
}
