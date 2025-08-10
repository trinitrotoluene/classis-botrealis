import { db } from "@src/database";
import { CommandBase } from "@src/framework";
import { sql } from "kysely";

interface Args {
  name?: string;
  hasCompendiumEntry?: boolean;
}

interface Response {
  results: Array<{
    id: string;
    name: string;
    description: string;
    volume: number;
    tier: number;
    rarity: string;
  }>;
}

export default class SearchItemsQuery extends CommandBase<Args, Response> {
  async execute() {
    let builder = db.selectFrom("items").selectAll();

    if (this.args.hasCompendiumEntry !== undefined) {
      builder = builder.where(
        "has_compendium_entry",
        "is",
        this.args.hasCompendiumEntry
      );
    }

    if (this.args.name !== undefined) {
      // This query is much more expensive to run
      if (this.args.name.length > 5) {
        builder = builder
          .where("name", sql`%`, this.args.name)
          .orderBy(sql`similarity(name, ${this.args.name})`, (ob) => ob.desc())
          .limit(25);
      } else {
        builder = builder
          .where("name", "ilike", `%${this.args.name}%`)
          .limit(25);
      }
    }

    const results = await builder.execute();

    return {
      results: results.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description ?? "",
        volume: item.volume,
        tier: item.tier,
        rarity: item.rarity,
      })),
    };
  }
}
