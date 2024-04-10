import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  bold,
  italic,
  underscore,
} from "discord.js";
import { currentSeason, defaultSeason } from "../../.env.json";
import { allGuides } from "../features/store/guides";

export default {
  metadata: new SlashCommandBuilder()
    .setName("progress")
    .setDescription("Show guide progress")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const finished = "✅",
      wip = "🏗️";
    const guides = await allGuides();
    const fullyUpdated = Object.values(guides).every(
      (guide) => guide.season == currentSeason,
    );
    await interaction.reply(`${bold("List of accessible/currently worked on guides:")}${fullyUpdated ? italic(`\nALL GUIDES ARE UPDATED TO SEASON ${currentSeason}!`) : ""}

${Object.entries(guides)
  .sort((a, b) =>
    a[1].public != b[1].public
      ? b[1].public
        ? 1
        : -1
      : a[0].localeCompare(b[0]),
  )
  .map(([champ, guide]) => {
    return `${guide.public ? finished : wip}  ${bold(`${champ}${guide.season != currentSeason ? " " + underscore(`(Season ${guide.season ?? defaultSeason})`) : ""}`)}`;
  })
  .reduce((a, b) => `${a}${b}\n`, "")}
        `);
  },
};
