import {
  ContainerBuilder,
  MessageFlags,
  SlashCommandBuilder,
  userMention,
} from "discord.js";
import { commandDefinition } from "./sdk/CommandBuilder";
import { CommandBus } from "@src/framework";
import CreateUserLinkRequestCommand from "@src/application/commands/config/CreateUserLinkRequestCommand";
import GetAllLinkedBitcraftAccountsQuery from "@src/application/queries/config/GetAllLinkedBitcraftAccountsQuery";

export const data = new SlashCommandBuilder()
  .setName("link")
  .setDescription("Link your Discord account to a Bitcraft account")
  .addSubcommand((s) =>
    s
      .setName("setup")
      .setDescription("Generate a one-time code to set up the link"),
  )
  .addSubcommand((s) =>
    s
      .setName("view")
      .setDescription("Check which Bitcraft accounts you have linked")
      .addUserOption((o) =>
        o
          .setName("user")
          .setRequired(false)
          .setDescription(
            "The user to check account links for - if not provided, defaults to the current user",
          ),
      ),
  );

const { registerSubCommand, ...command } = commandDefinition();
export const execute = command.execute;
export const autocomplete = command.autocomplete;

registerSubCommand("setup", {
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

registerSubCommand("view", {
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
