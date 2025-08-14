/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { REST, Routes } from "discord.js";
import { CommandsCollection } from "..";
import { Config } from "@src/config";

const rest = new REST().setToken(Config.discord.token);

const globalCommands = [
  ...CommandsCollection.values()
    .filter((x) => !x.isAdminGuildOnly)
    .map((command) => command.data),
];

const privateCommands = [
  ...CommandsCollection.values()
    .filter((x) => x.isAdminGuildOnly)
    .map((command) => command.data),
];

await rest.put(Routes.applicationCommands(Config.discord.dev_app_id!), {
  body: globalCommands,
});

await rest.put(
  Routes.applicationGuildCommands(
    Config.discord.dev_app_id!,
    Config.discord.dev_guild_id!
  ),
  { body: privateCommands }
);
