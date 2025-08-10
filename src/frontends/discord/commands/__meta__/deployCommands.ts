/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { REST, Routes } from "discord.js";
import { CommandsCollection } from "..";
import { Config } from "@src/config";

const rest = new REST().setToken(Config.discord.token);

const commands = [
  ...CommandsCollection.values().map((command) => command.data),
];

await rest.put(Routes.applicationCommands(Config.discord.dev_app_id!), {
  body: commands,
});
