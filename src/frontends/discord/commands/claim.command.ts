import {
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SlashCommandBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { CommandBus, QueryBus } from "@src/framework";
import UpdateServerConfigCommand from "@src/application/commands/config/UpdateServerConfigCommand";
import GetServerConfigQuery from "@src/application/queries/config/GetServerConfigQuery";
import { commandDefinition } from "./sdk/CommandBuilder";
import SearchClaimsQuery from "@src/application/queries/bitcraft/SearchClaimsQuery";
import GetClaimQuery from "@src/application/queries/bitcraft/GetClaimQuery";
import CreateClaimSubscriptionCommand from "@src/application/commands/bitcraft/CreateClaimSubscriptionCommand";

export const data = new SlashCommandBuilder()
  .setName("claim")
  .setDescription("Manage and interact your claim settings")
  .addSubcommand((s) =>
    s
      .setName("configure")
      .setDescription("Set the claim your Discord server is tracking")
      .addStringOption((o) =>
        o
          .setName("name")
          .setDescription("The name of the claim")
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand((s) =>
    s
      .setName("unset")
      .setDescription("Unset the claim the server is currently linked with")
  )
  .addSubcommand((s) =>
    s.setName("view").setDescription("View the claim you have configured")
  );

const { registerSubCommand, ...command } = commandDefinition();
export const execute = command.execute;
export const autocomplete = command.autocomplete;

registerSubCommand("view", {
  async execute(i) {
    if (!i.guildId) {
      await i.reply({
        content: "This command is only valid when run in a server!",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const queryResult = await QueryBus.execute(
      new GetServerConfigQuery({
        serverId: i.guildId,
      })
    );

    if (!queryResult.ok) {
      i.reply({
        content:
          "Sorry, I encountered an error fetching your server's configuration",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const { linkedClaimId } = queryResult.data;

    const getClaimQuery = await QueryBus.execute(
      new GetClaimQuery({ claimId: linkedClaimId ?? "" })
    );

    const header = new TextDisplayBuilder().setContent("**Configured claim**");

    const spacer = new SeparatorBuilder().setSpacing(
      SeparatorSpacingSize.Small
    );

    const body = new TextDisplayBuilder().setContent(
      linkedClaimId
        ? `Your server is linked with the claim ${getClaimQuery.ok ? (getClaimQuery.data?.name ?? linkedClaimId) : linkedClaimId}`
        : "Your server is not currently linked with a claim"
    );

    await i.reply({
      components: [header, spacer, body],
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });
  },
});

registerSubCommand("configure", {
  async autocomplete(i) {
    const focusedInput = i.options.getFocused();
    const result = await QueryBus.execute(
      new SearchClaimsQuery({
        claimName: focusedInput,
      })
    );
    if (result.ok) {
      i.respond(
        result.data.results.map((x) => ({
          name: x.name,
          value: x.entityId,
        }))
      );
    }
  },
  async execute(i) {
    if (!i.guildId) {
      await i.reply({
        content: "This command is only valid when run in a server!",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const selectedClaimId = i.options.getString("name");
    const claim = await QueryBus.execute(
      new GetClaimQuery({ claimId: selectedClaimId ?? "" })
    );

    if (!claim.ok || !claim.data) {
      await i.reply({
        content: `Sorry, I can't find that claim right now`,
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const result = await CommandBus.execute(
      new UpdateServerConfigCommand({
        serverId: i.guildId,
        claimId: claim.data.entityId.toString(),
      })
    );

    if (!result.ok) {
      await i.reply({
        content: "Sorry, something went wrong saving that information",
        flags: MessageFlags.Ephemeral,
      });
    }

    await CommandBus.execute(
      new CreateClaimSubscriptionCommand({
        claimId: claim.data.entityId,
      })
    );

    await i.reply({
      content: `Linked your server with claim ${claim.data.name}`,
      flags: MessageFlags.Ephemeral,
    });
  },
});

registerSubCommand("unset", {
  async execute(i) {
    if (!i.guildId) {
      await i.reply({
        content: "This command is only valid when run in a server!",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const result = await CommandBus.execute(
      new UpdateServerConfigCommand({
        serverId: i.guildId,
        claimId: null,
      })
    );

    if (result.ok) {
      await i.reply({
        content: `Unlinked your server from its current claim`,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await i.reply({
        content: "Sorry, something went wrong saving that information",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
});
