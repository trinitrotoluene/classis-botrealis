import { CommandBase } from "@src/framework";
import { CacheClient } from "@src/vela";

interface Args {
  id: string;
}

interface Response {
  id: string;
  name?: string;
}

export default class GetUsernameQuery extends CommandBase<Args, Response> {
  async execute() {
    const usernameState = await CacheClient.getByIdGlobal(
      "BitcraftUsernameState",
      this.args.id,
    );

    return {
      id: usernameState?.Id ?? this.args.id,
      name: usernameState?.Username,
    };
  }
}
