import { ActionRowBuilder, AutocompleteInteraction, BaseMessageOptions, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, InteractionReplyOptions, SlashCommandBuilder, codeBlock, escapeCodeBlock } from "discord.js";
import { randomSplashArtUrl, splashArtUrl } from "../features/riot/champs";
import { allGuides, getGuide } from "../features/store/guides";
import { ButtonMetadata, createButton } from "../util/discord";
import { renderPreview } from "../features/image/renderPreview";
import { feedbackChannelUrl } from "../../.env.json"

async function guideReply(champion: string, topic?: string) {
    const guide = await getGuide(champion)
    if (!guide) return undefined
    const topics = Object.keys(guide.contents)
    // in case we removed/renamed the topic after the initial message has been sent
    const actualTopic = (topic && guide.contents[topic] !== undefined) ? topic : topics[0]
    const content = guide.contents[actualTopic]
    return {
        content: codeBlock(escapeCodeBlock(content)),
        components: [new ActionRowBuilder().addComponents(
            ...topics.map((topic) => createButton(topic, {
                command: "guide",
                action: topic,
                champion,
            }, topic == actualTopic ? ButtonStyle.Success : ButtonStyle.Primary)),
            new ButtonBuilder().setLabel("Feedback").setURL(feedbackChannelUrl).setStyle(ButtonStyle.Link)
        )],
        files: [{
            attachment: await renderPreview(await randomSplashArtUrl(champion), guide.image.runes, guide.image.starter, guide.image.difficulty, guide.image.smallText)
        }]
    } as BaseMessageOptions
}

export default {
    metadata: new SlashCommandBuilder()
        .setName("guide")
        .setDescription("Matchup guide against specific champion")
        .addStringOption(option =>
           option.setName("champion").setDescription("Yone vs. x").setRequired(true).setAutocomplete(true)
        ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const champion = interaction.options.getString("champion")
        const reply = await guideReply(champion)
        if (reply) {
            await interaction.reply(reply)
        } else {
            await interaction.reply({ content: 'No guide exists for this champion!', ephemeral: true })
        }
    },
    autocomplete: async (interaction: AutocompleteInteraction) => {
        const champions = Object.keys(await allGuides())
        const searchQuery = interaction.options.getFocused().toLowerCase()
        const searchResult = champions.filter((c) => c.toLowerCase().startsWith(searchQuery))
        if (searchResult.length > 25) {
            await interaction.respond([])
            return
        }
        await interaction.respond(searchResult.map((c) => ({name: c, value: c})))
    },
    button: async (interaction: ButtonInteraction, metadata: ButtonMetadata & { champion: string }) => {
        const reply = await guideReply(metadata.champion, metadata.action)
        if (reply) {
            await interaction.update(reply)
        } else {
            await interaction.reply({ content: 'Guide got removed!', ephemeral: true })
        }
    }
}