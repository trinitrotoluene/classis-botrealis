import { db } from "@src/database";
import { CommandBase } from "@src/framework";
import { CacheClient } from "@src/vela";

interface Args {
  discordUserId: string;
}

type Response = Array<{
  id: string;
  username: string;
}>;

export default class GetAllLinkedBitcraftAccountsQuery extends CommandBase<
  Args,
  Response
> {
  async execute() {
    const linkedAccounts = await db
      .selectFrom("user_links")
      .selectAll()
      .where("discord_user_id", "=", this.args.discordUserId)
      .execute();

    return Promise.all(
      linkedAccounts.map(async (account) => {
        const username = await CacheClient.getByIdGlobal(
          "BitcraftUsernameState",
          account.bitcraft_user_id,
        );

        return {
          id: account.bitcraft_user_id,
          username: username?.Username ?? "n/a",
        };
      }),
    );
  }
}
