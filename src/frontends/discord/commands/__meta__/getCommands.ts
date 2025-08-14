import type ServerFeature from "@src/database/__generated__/public/ServerFeature";
import { logger } from "@src/logger";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Collection,
  SlashCommandBuilder,
} from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";

interface ISlashCommandDefinition {
  requiredPermissions?: bigint;
  isAdminGuildOnly?: boolean;
  requiredFeatures?: ServerFeature[];
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export async function getCommands(
  currentDir: string,
  collection?: Collection<string, ISlashCommandDefinition>
): Promise<Collection<string, ISlashCommandDefinition>> {
  logger.info(`Loading commands from directory: ${currentDir}`);

  collection = collection ?? new Collection<string, ISlashCommandDefinition>();

  const dirContents = readdirSync(currentDir, { withFileTypes: true });
  const files = dirContents.filter(
    (file) => file.isFile() && file.name.endsWith(".command.ts")
  );

  logger.info(`Found ${files.length} command file(s) in ${currentDir}`);

  for (const file of files) {
    logger.info(`Processing command file: ${file.name}`);
    const fullPath = join(currentDir, file.name);
    const commandModule = await import(fullPath);

    const command = commandModule.default || commandModule;
    if (!command.data || !command.execute) {
      logger.warn(
        `Command in ${fullPath} does not have required properties 'data' and 'execute'`
      );
      continue;
    }
    collection.set(command.data.name, command);
    logger.info(`Registered command: ${command.data.name}`);
  }

  // get all subdirectories and register commands recursively
  const subdirs = readdirSync(currentDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && dirent.name !== "__meta__")
    .map((dirent) => dirent.name);

  for (const subdir of subdirs) {
    const subdirPath = join(currentDir, subdir);
    await getCommands(subdirPath, collection);
  }

  return collection;
}
