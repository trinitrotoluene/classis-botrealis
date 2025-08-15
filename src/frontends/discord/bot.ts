import { Config } from "@src/config";
import { logger } from "@src/logger";
import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { CommandsCollection } from "./commands";
import { db } from "@src/database";
import { CommandBus, PubSub, QueryBus } from "@src/framework";
import InitialiseBitcraftServiceCommand from "@src/application/commands/bitcraft/InitialiseBitcraftServiceCommand";
import CreateClaimSubscriptionCommand from "@src/application/commands/bitcraft/CreateClaimSubscriptionCommand";
import { onMessageOrModAction } from "./subscribers/onMessageOrModAction";
import { onApplicationSharedCraftRemoved } from "./subscribers/onApplicationSharedCraftRemoved";
import { onApplicationSharedCraftStarted } from "./subscribers/onApplicationSharedCraftStarted";
import GetEnabledFeaturesQuery from "@src/application/queries/config/GetEnabledFeaturesQuery";
import { onApplicationEmpireTreasuryChanged } from "./subscribers/onApplicationEmpireTreasuryChanged";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.on(Events.ClientReady, async (client) => {
  logger.info("Connected to Discord as " + client.user?.tag);
  await client.application.fetch();

  await CommandBus.execute(new InitialiseBitcraftServiceCommand({}));

  // todo wtf? why is this not a Query
  const serverConfigs = await db
    .selectFrom("server_config")
    .select("linked_claim_id")
    .where("linked_claim_id", "is not", null)
    .execute();

  const linkedClaimIds = new Set(serverConfigs.map((x) => x.linked_claim_id));
  for (const claimId of linkedClaimIds.values()) {
    if (claimId) {
      await CommandBus.execute(new CreateClaimSubscriptionCommand({ claimId }));
    }
  }

  PubSub.subscribe("bitcraft_chat_message", onMessageOrModAction);
  PubSub.subscribe("bitcraft_user_moderated", onMessageOrModAction);
  PubSub.subscribe("application_shared_craft_started", (e) =>
    onApplicationSharedCraftStarted(client, e)
  );
  PubSub.subscribe("application_shared_craft_removed", (e) =>
    onApplicationSharedCraftRemoved(client, e)
  );
  PubSub.subscribe("application_empire_treasury_changed", (e) =>
    onApplicationEmpireTreasuryChanged(client, e)
  );
});

client.on(Events.GuildAvailable, (guild) => {
  logger.info(
    { guildId: guild.id },
    `Guild available: ${guild.name} (${guild.id})`
  );
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isAutocomplete()) {
    return;
  }

  logger.debug({ interactionId: interaction.id, type: interaction.type });

  const command = CommandsCollection.get(interaction.commandName);
  if (!command) {
    logger.warn({ commandName: interaction.commandName }, "Command not found");
    return;
  }

  if (!command.autocomplete) {
    logger.warn(
      { commandName: interaction.commandName },
      "Command does not support autocomplete"
    );
    return;
  }

  try {
    await command.autocomplete(interaction);
  } catch (error) {
    logger.error(
      { error, commandName: interaction.commandName },
      "Error executing autocomplete"
    );
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  logger.debug({ interactionId: interaction.id, type: interaction.type });

  const command = CommandsCollection.get(interaction.commandName);
  if (!command) {
    logger.warn({ commandName: interaction.commandName }, "Command not found");
    await interaction.reply({
      content: "Sorry, I don't know how to respond to that command yet.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (command.requiredFeatures) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: "This command can only be run in a Discord server",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const enabledFeatures = await QueryBus.execute(
      new GetEnabledFeaturesQuery({ serverId: interaction.guildId })
    );

    if (!enabledFeatures.ok) {
      await interaction.reply({
        content:
          "This command depends on a feature check which was not successful",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    for (const requiredFeature of command.requiredFeatures) {
      console.log(enabledFeatures.data);
      if (
        !enabledFeatures.data.enabledFeatures.find((x) => x === requiredFeature)
      ) {
        await interaction.reply({
          content: `This command requires the following features to be enabled for your server ${command.requiredFeatures.join(", ")}`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }
  }

  if (
    command.requiredPermissions &&
    !interaction.memberPermissions?.has(command.requiredPermissions)
  ) {
    logger.warn(
      {
        requiredPermissions: command.requiredPermissions,
        interactionPermissions: interaction.memberPermissions,
      },
      "command permissions out of sync"
    );

    return;
  }

  try {
    logger.info(
      {
        commandName: interaction.command?.name,
        subCommand: interaction.options.getSubcommand(),
        options: interaction.options.data,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        userId: interaction.user?.id,
        username: interaction.user?.username,
      },
      "executing slash command"
    );

    if (
      command.isAdminGuildOnly &&
      interaction.user.id !== interaction.client.application.owner?.id
    ) {
      logger.warn("Non admin user attempted to execute admin command");
      return;
    }

    await command.execute(interaction);
  } catch (error) {
    logger.error(
      { error, commandName: interaction.commandName },
      "Error executing command"
    );

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content:
          "Apologies, looks like something went wrong while processing your command.",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content:
          "Apologies, looks like something went wrong while processing your command.",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

await client.login(Config.discord.token);
