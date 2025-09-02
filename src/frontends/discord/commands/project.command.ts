import CreateProjectCommand from "@src/application/commands/projects/CreateProjectCommand";
import { CommandBus } from "@src/framework";
import { logger } from "@src/logger";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { commandDefinition } from "./sdk/CommandBuilder";

export const data = new SlashCommandBuilder()
  .setName("project")
  .setDescription("Manage and interact with Bitcraft projects.")
  .addSubcommand((s) =>
    s
      .setName("create")
      .setDescription("Create a new Bitcraft project")
      .addStringOption((o) =>
        o
          .setName("name")
          .setDescription("What should the project be called?")
          .setRequired(true),
      ),
  )
  .addSubcommand((s) =>
    s.setName("list").setDescription("List all active Bitcraft projects"),
  )
  .addSubcommand((s) =>
    s
      .setName("close")
      .setDescription("Close a Bitcraft project")
      .addStringOption((o) =>
        o
          .setName("name")
          .setDescription("What is the name of the project to close?")
          .setRequired(true)
          .setAutocomplete(true),
      ),
  )
  .addSubcommand((s) =>
    s
      .setName("add")
      .setDescription("Add a resource target to a project")
      .addStringOption((o) =>
        o
          .setName("name")
          .setDescription(
            "What is the name of the project to add a resource to?",
          )
          .setRequired(true)
          .setAutocomplete(true),
      )
      .addStringOption((o) =>
        o
          .setName("resource")
          .setDescription("What is the resource to add?")
          .setRequired(true)
          .setAutocomplete(true),
      ),
  )
  .addSubcommand((s) =>
    s
      .setName("thread")
      .setDescription("Create a thread for a project")
      .addStringOption((o) =>
        o
          .setName("name")
          .setDescription(
            "What is the name of the project to create a thread for?",
          )
          .setRequired(true)
          .setAutocomplete(true),
      ),
  );

const { registerSubCommand, ...command } = commandDefinition();
export const execute = command.execute;
export const autocomplete = command.autocomplete;

registerSubCommand("list", {
  async autocomplete(i) {
    await i.respond(
      ["cool project 1", "cool project 2"].map((name) => ({
        name,
        value: name,
      })),
    );
  },
});
registerSubCommand("create", {
  async execute(i) {
    const projectName = i.options.getString("name", true);
    logger.info(`Creating project: ${projectName}`);

    const command = new CreateProjectCommand({ projectName });
    const result = await CommandBus.execute(command);

    if (!result.ok) {
      logger.error("Failed to create project");
      await i.reply({
        content: `Failed to create project: ${result.message}`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await i.reply({
      content: `Created project "${projectName}"!`,
      flags: MessageFlags.Ephemeral,
    });
  },
});
