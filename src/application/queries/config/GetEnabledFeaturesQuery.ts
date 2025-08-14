import { db } from "@src/database";
import type { ServerConfigId } from "@src/database/__generated__/public/ServerConfig";
import type ServerFeature from "@src/database/__generated__/public/ServerFeature";
import { CommandBase } from "@src/framework";

interface Args {
  serverId: string;
}

interface Response {
  enabledFeatures: ServerFeature[];
}

export default class GetEnabledFeaturesQuery extends CommandBase<
  Args,
  Response
> {
  async execute() {
    const result = await db
      .selectFrom("server_config")
      .select("features_enabled")
      .where("id", "=", this.args.serverId as ServerConfigId)
      .executeTakeFirst();

    return { enabledFeatures: result?.features_enabled ?? [] };
  }
}
