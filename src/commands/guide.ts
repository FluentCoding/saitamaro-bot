import { ActionRowBuilder, AutocompleteInteraction, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Colors, EmbedBuilder, InteractionEditReplyOptions, MessageActionRowComponentBuilder, SlashCommandBuilder, codeBlock } from "discord.js";
import { currentSeason, defaultSeason, feedbackChannelUrl, unrestrictedChannelId } from "../../.env.json";
import { randomPreview } from "../features/image/cache";
import { Champion } from "../features/riot/champs";
import { allGuides, getGuideCaseInsensitive } from "../features/store/guides";
import { ButtonMetadata, createButton } from "../util/discord";

async function guideReply(issuer: string, championSearchQuery: string, channelId: string, topic?: string): Promise<InteractionEditReplyOptions | undefined> {
    const guideResult = await getGuideCaseInsensitive(championSearchQuery)
    if (!guideResult || (channelId != unrestrictedChannelId && !guideResult.guide.public)) return undefined
    const guide = guideResult.guide
    const champion = guideResult.name as Champion
    
    const topics = Object.keys(guide.contents)
    // in case we removed/renamed the topic after the initial message has been sent
    const actualTopic = (topic && guide.contents[topic] !== undefined) ? topic : topics[0]
    const content = guide.contents[actualTopic]
    return {
        content: codeBlock(content.replaceAll("`", "`​").substring(0, 2000 - 6 - 2)), // 6 = triple quote, 2 double newline
        components: [new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            ...topics.map((topic) => createButton(topic, {
                cmd: "guide",
                tag: topic,
                iss: issuer,
                champ: champion,
            }, topic == actualTopic ? ButtonStyle.Success : ButtonStyle.Primary)),
            ...(feedbackChannelUrl ? [new ButtonBuilder().setLabel("Feedback").setURL(feedbackChannelUrl).setStyle(ButtonStyle.Link)] : [])
        )],
        embeds: guide.season != currentSeason ? [
            new EmbedBuilder()
                .setColor(Colors.Red)
                .setTitle("Warning")
                .setDescription(`This guide has been made for season ${guide.season ?? defaultSeason} and might contain outdated information`)
        ] : undefined,
        files: [{
            attachment: await randomPreview(champion, guide)
        }]
    }
}

export default {
    metadata: new SlashCommandBuilder()
        .setName("guide")
        .setDescription("Matchup guide against specific champion")
        .addStringOption(option =>
           option.setName("champion").setDescription("Yone vs. x (Type the first letters of the champ to see autocomplete suggestions)").setRequired(true).setAutocomplete(true)
        ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply()
        const champion = interaction.options.getString("champion", true)
        const reply = await guideReply(interaction.user.id, champion, interaction.channelId)
        if (reply) {
            await interaction.editReply(reply)
        } else {
            await interaction.followUp({ content: 'No guide exists for this champion!', ephemeral: true })
        }
    },
    autocomplete: async (interaction: AutocompleteInteraction) => {
        try {
            const guides = await allGuides()
            const champions = Object.keys(guides) as Champion[]
            const searchQuery = interaction.options.getFocused().toLowerCase()
            let searchResult = champions.filter((c) => c.toLowerCase().startsWith(searchQuery))
            if (interaction.channelId != unrestrictedChannelId) searchResult = searchResult.filter((c) => guides[c].public)
            if (searchResult.length > 25) {
                await interaction.respond([])
                return
            }
            await interaction.respond(searchResult.sort().map((c) => ({name: c, value: c})))
        } catch(e) {
            console.log("Failed to autocomplete guides", e)
        }
    },
    button: async (interaction: ButtonInteraction, metadata: ButtonMetadata & { champ: string, iss: string }) => {
        if (metadata.iss != interaction.user.id) {
            await interaction.reply({ content: 'You can only navigate your own guides! Check out `/guide`!', ephemeral: true })
            return
        }
        await interaction.deferUpdate()
        const reply = await guideReply(metadata.iss, metadata.champ, interaction.channelId, metadata.tag)
        if (reply) {
            await interaction.editReply(reply)
        } else {
            await interaction.followUp({ content: 'Guide got removed!', ephemeral: true })
        }
    }
}