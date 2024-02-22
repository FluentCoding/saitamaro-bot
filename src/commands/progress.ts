import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder, bold, underscore } from "discord.js"
import { allGuides } from "../features/store/guides"
import { currentSeason, defaultSeason } from "../../.env.json"

export default {
    metadata: new SlashCommandBuilder()
        .setName("progress")
        .setDescription("Show guide progress")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const finished = '✅', wip = '🏗️'
        const guides = await allGuides()
        await interaction.reply(`${bold("List of accessible/currently worked on guides:")}

${Object.entries(guides).sort((a, b) => a[1].public != b[1].public ? (b[1].public ? 1 : -1) : a[0].localeCompare(b[0])).map(([champ, guide]) => {
    return `${guide.public ? finished : wip}  ${bold(`${champ}${guide.season != currentSeason ? " " + underscore(`(Season ${guide.season ?? defaultSeason})`) : ''}`)}`
}).reduce((a, b) => `${a}${b}\n`, "")}
        `)
    }
}