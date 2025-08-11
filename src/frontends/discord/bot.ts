import { Config } from "@src/config";
import { logger } from "@src/logger";
import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { CommandsCollection } from "./commands";
import { db } from "@src/database";
import { CommandBus, PubSub } from "@src/framework";
import InitialiseBitcraftServiceCommand from "@src/application/commands/bitcraft/InitialiseBitcraftServiceCommand";
import CreateClaimSubscriptionCommand from "@src/application/commands/bitcraft/CreateClaimSubscriptionCommand";
import { onMessageOrModAction } from "./subscribers/onMessageOrModAction";
import { onApplicationSharedCraftRemoved } from "./subscribers/onApplicationSharedCraftRemoved";
import { onApplicationSharedCraftStarted } from "./subscribers/onApplicationSharedCraftStarted";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.on(Events.ClientReady, async (client) => {
  logger.info("Connected to Discord as " + client.user?.tag);

  await CommandBus.execute(new InitialiseBitcraftServiceCommand({}));

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

  try {
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
