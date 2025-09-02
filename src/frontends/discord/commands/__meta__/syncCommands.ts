import { REST, Routes } from "discord.js";
import { CommandsCollection } from "..";
import { Config } from "@src/config";
import { logger } from "@src/logger";

logger.info("Syncing commands to Discord...");

const rest = new REST().setToken(Config.discord.token);

if (!Config.discord.dev_guild_id || !Config.discord.dev_app_id) {
  throw new Error(
    "Development guild ID and user ID must be set in the config.",
  );
}

try {
  const commands = [
    ...CommandsCollection.values().map((command) => command.data),
  ];

  const response: unknown[] = (await rest.put(
    Routes.applicationGuildCommands(
      Config.discord.dev_app_id,
      Config.discord.dev_guild_id,
    ),
    { body: commands },
  )) as unknown[];

  logger.info(`Successfully synced ${response.length} commands to guild'`);
} catch (error) {
  logger.error(error);
}
