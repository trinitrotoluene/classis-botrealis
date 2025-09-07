import {
  ChannelType,
  ContainerBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ThreadAutoArchiveDuration,
  userMention,
} from "discord.js";
import { commandDefinition } from "./sdk/CommandBuilder";
import { CommandBus, QueryBus } from "@src/framework";
import CreateUserLinkRequestCommand from "@src/application/commands/config/CreateUserLinkRequestCommand";
import GetAllLinkedBitcraftAccountsQuery from "@src/application/queries/config/GetAllLinkedBitcraftAccountsQuery";
import { logger } from "@src/logger";
import CreateInventoryLinkRequestCommand from "@src/application/commands/config/CreateInventoryLinkRequestCommand";

export const data = new SlashCommandBuilder()
  .setName("link")
  .setDescription("Link your Discord account to a Bitcraft account")
  .addSubcommand((s) =>
    s
      .setName("player")
      .setDescription("Generate a one-time code to set up the link"),
  )
  .addSubcommand((s) =>
    s
      .setName("view-players")
      .setDescription("Check which Bitcraft accounts someone has linked")
      .addUserOption((o) =>
        o
          .setName("user")
          .setRequired(false)
          .setDescription(
            "The user to check account links for - if not provided, defaults to the current user",
          ),
      ),
  )
  .addSubcommand((s) =>
    s
      .setName("inventory")
      .setDescription("Set up a thread tracking a target inventory")
      .addStringOption((o) =>
        o
          .setName("name")
          .setDescription(
            "Choose a name for your inventory, this will display prominently in the tracking thread",
          )
          .setRequired(true),
      )
      .addStringOption((o) =>
        o
          .setName("user")
          .setAutocomplete(true)
          .setRequired(true)
          .setDescription(
            "The bitcraft user you will use to set up monitoring - use /link player to set this up",
          ),
      ),
  );

const { registerSubCommand, ...command } = commandDefinition();
export const execute = command.execute;
export const autocomplete = command.autocomplete;

registerSubCommand("player", {
  async execute(i) {
    const linkResponse = await CommandBus.execute(
      new CreateUserLinkRequestCommand({ discord_user_id: i.user.id }),
    );

    if (!linkResponse.ok) {
      await i.reply({
        content: "Sorry, something went wrong generating your one-time code",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await i.reply({
      content: `Ready to link your Bitcraft account - please send the code below in **LOCAL** chat in-game.
## ${linkResponse.data.otp}
Code expires in <t:${Math.floor(linkResponse.data.otpExpiryDate.getTime() / 1000)}:R>
`,
      flags: MessageFlags.Ephemeral,
    });
  },
});

registerSubCommand("view-players", {
  async execute(i) {
    const userToCheck = i.options.getUser("user", false) ?? i.user;

    const linkedUsers = await CommandBus.execute(
      new GetAllLinkedBitcraftAccountsQuery({ discordUserId: userToCheck.id }),
    );

    if (!linkedUsers.ok) {
      await i.reply({
        content: "Sorry, something went wrong generating your one-time code",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await i.reply({
      components: [
        new ContainerBuilder()
          .setAccentColor(0x4b65fa)
          .addTextDisplayComponents((c) =>
            c.setContent(`### ${userMention(userToCheck.id)} linked accounts
${linkedUsers.data.map((link) => `- ${link.username}`).join("\n")}`),
          ),
      ],
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      allowedMentions: {},
    });
  },
});

registerSubCommand("inventory", {
  requiredPermissions: PermissionFlagsBits.ManageMessages,
  async autocomplete(i) {
    const linkedPlayersResponse = await QueryBus.execute(
      new GetAllLinkedBitcraftAccountsQuery({ discordUserId: i.user.id }),
    );

    if (!linkedPlayersResponse.ok) {
      await i.respond([]);
    } else {
      await i.respond(
        linkedPlayersResponse.data.map((x) => ({
          name: x.username,
          value: x.id,
        })),
      );
    }
  },
  async execute(i) {
    const bitcraftUserId = i.options.getString("user", true);
    const inventoryName = i.options.getString("name", true);

    if (!i.guildId) {
      await i.reply({
        content: "This command can only be used in a server!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channel = i.channel;
    if (!channel || channel.type !== ChannelType.GuildText) {
      await i.reply({
        content: "Unsupported channel type",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const thread = await channel.threads.create({
      name: `[auto] Inventory ${inventoryName}`,
      reason:
        "This thread automatically tracks changes in a bitcraft inventory",
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    });

    const pendingContainer = new ContainerBuilder().addTextDisplayComponents(
      (c) =>
        c.setContent(
          `⏳ Inventory tracking pending, please add an item to the target inventory to complete setup`,
        ),
    );

    const message = await thread.send({
      components: [pendingContainer],
      flags: MessageFlags.IsComponentsV2,
    });

    try {
      await message.pin();
    } catch (err) {
      logger.debug(err);
    }

    const createLinkRequestResponse = await CommandBus.execute(
      new CreateInventoryLinkRequestCommand({
        trackedInventoryName: inventoryName,
        creatorLinkedBitcraftAccountId: bitcraftUserId,
        discordChannelId: thread.id,
        discordMessageId: message.id,
        creatorDiscordId: i.user.id,
      }),
    );

    if (!createLinkRequestResponse.ok) {
      await i.reply({
        content:
          "Something went wrong preparing the inventory link - please delete the created thread and try again.",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await i.reply({
        content:
          "👉 Please designate an inventory for me to track by inserting an item into it.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
});
