import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
} from "discord.js";

export type CommandType = {
  requiredPermissions?: bigint;
  autocomplete?: (i: AutocompleteInteraction) => Promise<void>;
  execute?: (i: ChatInputCommandInteraction) => Promise<void>;
};
