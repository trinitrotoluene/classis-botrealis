import {
  MessageFlags,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { CommandType } from "./commandType";

export function commandDefinition() {
  const subcommands: Record<string, CommandType> = {};

  return {
    autocomplete(interaction: AutocompleteInteraction) {
      const s = interaction.options.getSubcommand();
      const def = subcommands[s];
      if (def && def.autocomplete) {
        return def.autocomplete(interaction);
      }

      throw new Error("Unexpected autocomplete");
    },
    execute(interaction: ChatInputCommandInteraction) {
      const s = interaction.options.getSubcommand();
      const def = subcommands[s];
      if (
        def.requiredPermissions &&
        !interaction.memberPermissions?.has(def.requiredPermissions)
      ) {
        return interaction.reply({
          content: "You don't have permission to run this command",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (def && def.execute) {
        return def.execute(interaction);
      }
    },
    registerSubCommand(name: string, definition: CommandType) {
      subcommands[name] = definition;
    },
  };
}
