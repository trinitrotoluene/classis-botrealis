import { Config } from "@src/config";
import { logger } from "@src/logger";
import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { CommandsCollection } from "./commands";
import { CommandBus, QueryBus } from "@src/framework";
import {
  onBitcraftChatMessage,
  onBitcraftUserModerated,
} from "./subscribers/chatMessageAndModeration";
import GetEnabledFeaturesQuery from "@src/application/queries/config/GetEnabledFeaturesQuery";
import { onEmpireStateUpdated } from "./subscribers/empireState";
import { PubSub } from "@src/vela";
import {
  onSharedCraftInserted,
  onSharedCraftDeleted,
} from "./subscribers/publicProgressiveActions";
import ConnectToRedisCommand from "@src/application/commands/redis/ConnectToRedisCommand";
import {
  onAuctionListingStateDeleted,
  onAuctionListingStateInserted,
  onAuctionListingStateUpdated,
} from "./subscribers/auctionListingState";
import UpsertItemsFromCacheCommand from "@src/application/commands/bitcraft/UpsertItemsFromCacheCommand";
import UpsertRecipesFromCacheCommand from "@src/application/commands/bitcraft/UpsertRecipesFromCacheCommand";
import ResetOrderCacheCommand from "@src/application/commands/bitcraft/ResetOrderCacheCommand";
import {
  onEmpireNodeSiegeStateAdded,
  onEmpireNodeSiegeStateDeleted,
  onEmpireNodeSiegeStateUpdated,
} from "./subscribers/empireNodeSiegeState";
import { onInventoryStateUpdate } from "./subscribers/inventoryStateUpdate";
import { onHeartbeat } from "./subscribers/heartbeat";

export const DiscordBot = new Client({
  intents: [GatewayIntentBits.Guilds],
});

DiscordBot.on(Events.ClientReady, async (client) => {
  logger.info("Connected to Discord as " + client.user?.tag);
  await client.application.fetch();

  await CommandBus.execute(new ConnectToRedisCommand({}));
  await CommandBus.execute(new UpsertItemsFromCacheCommand({}));
  await CommandBus.execute(new UpsertRecipesFromCacheCommand({}));
  await CommandBus.execute(new ResetOrderCacheCommand({}));

  PubSub.subscribe(
    "bitcraft.BitcraftChatMessage.insert",
    onBitcraftChatMessage,
  );

  PubSub.subscribe(
    "bitcraft.BitcraftUserModerationState.insert",
    onBitcraftUserModerated,
  );

  PubSub.subscribe("bitcraft.BitcraftEmpireState.update", onEmpireStateUpdated);

  PubSub.subscribe(
    "bitcraft.BitcraftPublicProgressiveAction.insert",
    onSharedCraftInserted,
  );
  PubSub.subscribe(
    "bitcraft.BitcraftPublicProgressiveAction.delete",
    onSharedCraftDeleted,
  );

  PubSub.subscribe(
    "bitcraft.BitcraftAuctionListingState.insert",
    onAuctionListingStateInserted,
  );
  PubSub.subscribe(
    "bitcraft.BitcraftAuctionListingState.update",
    onAuctionListingStateUpdated,
  );
  PubSub.subscribe(
    "bitcraft.BitcraftAuctionListingState.delete",
    onAuctionListingStateDeleted,
  );
  PubSub.subscribe(
    "bitcraft.BitcraftEmpireNodeSiegeState.insert",
    onEmpireNodeSiegeStateAdded,
  );
  PubSub.subscribe(
    "bitcraft.BitcraftEmpireNodeSiegeState.update",
    onEmpireNodeSiegeStateUpdated,
  );
  PubSub.subscribe(
    "bitcraft.BitcraftEmpireNodeSiegeState.delete",
    onEmpireNodeSiegeStateDeleted,
  );

  PubSub.subscribe(
    "bitcraft.BitcraftInventoryState.update",
    onInventoryStateUpdate,
  );

  PubSub.subscribe("system.HeartbeatEvent", onHeartbeat);
});

DiscordBot.on(Events.GuildAvailable, (guild) => {
  logger.info(
    { guildId: guild.id },
    `Guild available: ${guild.name} (${guild.id})`,
  );
});

DiscordBot.on(Events.InteractionCreate, async (interaction) => {
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
      "Command does not support autocomplete",
    );
    return;
  }

  try {
    await command.autocomplete(interaction);
  } catch (error) {
    logger.error(
      { error, commandName: interaction.commandName },
      "Error executing autocomplete",
    );
  }
});

DiscordBot.on(Events.InteractionCreate, async (interaction) => {
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
      new GetEnabledFeaturesQuery({ serverId: interaction.guildId }),
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
      "command permissions out of sync",
    );

    await interaction.reply({
      content: "You don't have permission to run this command",
      flags: MessageFlags.Ephemeral,
    });

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
      "executing slash command",
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
      "Error executing command",
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

await DiscordBot.login(Config.discord.token);
