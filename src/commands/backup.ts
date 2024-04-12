import {
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  bold,
} from "discord.js";
import { backups, saveBackup } from "../features/store/backup";

const operationOption = ["list", "create", "delete", "open"] as const;
type OperationOption = (typeof operationOption)[number];

export default {
  metadata: new SlashCommandBuilder()
    .setName("backup")
    .setDescription("Manage guide backups")
    .addStringOption((option) =>
      option
        .setName("operation")
        .setDescription("Select your backup operation")
        .setRequired(true)
        .setChoices(...operationOption.map((o) => ({ name: o, value: o })))
    )
    .addStringOption((option) =>
      option
        .setName("backup")
        .setDescription("Backup id, if using delete or open")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const option = interaction.options.getString(
      "operation",
      true
    ) as OperationOption;

    switch (option) {
      case "list":
        await interaction.reply({
          embeds: [
            new EmbedBuilder({
              color: Colors.Aqua,
              title: "💾 Your backups",
              description: (await backups())
                .map(
                  (backup) =>
                    `${bold(
                      backup.id
                    )} [${backup.date.toLocaleDateString()} ${backup.date.toLocaleTimeString()}]`
                )
                .join("\n"),
            }),
          ],
        });
        break;
      case "create":
        await interaction.deferReply();
        const backup = await saveBackup();
        await interaction.followUp({
          embeds: [
            new EmbedBuilder({
              color: Colors.Green,
              title: "✅ Backup created",
              description: `${bold(
                "Date:"
              )} ${backup.date.toLocaleDateString()} ${backup.date.toLocaleTimeString()}\n${bold(
                "ID:"
              )} ${backup.id}`,
            }),
          ],
        });
        break;
      case "delete":
        break;
    }
  },
};
