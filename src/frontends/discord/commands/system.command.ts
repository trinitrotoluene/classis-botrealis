import {
  ContainerBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import {
  getServiceStatus,
  type ServiceStatus,
  type ServiceStatusSummary,
} from "../subscribers/heartbeat";
import { commandDefinition } from "./sdk/CommandBuilder";

export const data = new SlashCommandBuilder()
  .setName("system")
  .setDescription("Inspect a bitcraft item list")
  .addSubcommand((s) =>
    s.setName("status").setDescription("Check the bot's status"),
  );

const { registerSubCommand, ...command } = commandDefinition();
export const execute = command.execute;
export const autocomplete = command.autocomplete;

function formatService(service: ServiceStatus): string {
  const DOWN_GAP = 30 * 1000; // 30 seconds
  const inputTime = service.lastSeen.getTime();
  const isOnline = new Date().getTime() - inputTime < DOWN_GAP;

  return `\`${isOnline ? "🟢" : "🔴"} ${service.name}\``;
}

function formatBotStatus(status: ServiceStatusSummary) {
  return `Up since <t:${status.initDateEpoch}:R>`;
}

registerSubCommand("status", {
  async execute(i) {
    const status = getServiceStatus();
    const botDisplay = formatBotStatus(status);
    const serviceDisplay =
      status.services.length > 0
        ? status.services.map(formatService).join("\n")
        : "Offline";

    await i.reply({
      components: [
        new ContainerBuilder().addTextDisplayComponents((c) =>
          c.setContent(
            `### Bot status\n${botDisplay}\n### Bitcraft event gateways\n${serviceDisplay}`,
          ),
        ),
      ],
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });
  },
});
