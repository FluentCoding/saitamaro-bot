import {
  APIEmbed,
  ActionRowBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Client,
  Colors,
  DiscordAPIError,
  MessageActionRowComponentBuilder,
  MessageCreateOptions,
  MessageEditOptions,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { guildId } from "../../.env.json";
import {
  ClearRankedSummonersCacheMode,
  clearRankedSummonersCache,
  getSoloDuoRank,
  getSummonerID,
  getSummonerNickname,
  regionFromStr,
} from "../features/riot/leaderboard";
import {
  addLeaderboardEntry,
  getLeaderboard,
  getLeaderboardEntry,
  getLeaderboardMessageLocation,
  removeLeaderboardEntry,
  setLeaderboardMessageLocation,
} from "../features/store/leaderboard";
import { ButtonMetadata, createButton } from "../util/discord";
import { sortRank, withPlacePrefix, withRankEmoji } from "../util/rank";
import timestring = require("timestring");

const LIMIT = 10;
const REFRESH_INTERVAL = timestring("1h", "ms");
let currentUpdater: { timeout: Timer; nextUpdate: number } | undefined =
  undefined;

export async function runLeaderboardUpdater(
  client: Client<true>,
  runImmediately: boolean = false
) {
  if (!(await getLeaderboardMessageLocation())) return; // ignore updater request if no message location exists
  if (currentUpdater) clearInterval(currentUpdater.timeout);
  if (runImmediately) updateLeaderboardMessage(client, "all");
  currentUpdater = {
    timeout: setInterval(function () {
      if (currentUpdater) {
        currentUpdater.nextUpdate = +new Date() + REFRESH_INTERVAL;
      }
      updateLeaderboardMessage(client, "all");
    }, REFRESH_INTERVAL),
    nextUpdate: +new Date() + REFRESH_INTERVAL,
  };
}
async function updateLeaderboardMessage(
  client: Client<true>,
  refetch: ClearRankedSummonersCacheMode
) {
  try {
    console.info("Triggering leaderboard update!");
    const messageLocation = await getLeaderboardMessageLocation();
    if (!messageLocation) return;

    const channel = (await client.channels.fetch(
      messageLocation.channelId
    )) as TextChannel | null;
    if (channel == null) {
      console.error("Channel doesn't exist");
      return;
    }

    clearRankedSummonersCache(refetch);
    const messages = await renderLeaderboard(client);
    const newMessageIds = [];
    for (
      let i = 0;
      i < Math.max(messageLocation.messageIds.length, messages.length);
      i++
    ) {
      const shouldDelete = i >= messages.length,
        shouldAdd = i >= messageLocation.messageIds.length,
        currentMessageId = messageLocation.messageIds[i];
      if (shouldDelete) {
        await channel.messages.delete(currentMessageId);
      } else if (shouldAdd) {
        newMessageIds.push(
          (await channel.send(messages[i] as MessageCreateOptions)).id
        );
      } else {
        await channel.messages.edit(
          currentMessageId,
          messages[i] as MessageEditOptions
        );
        newMessageIds.push(currentMessageId);
      }
    }
    setLeaderboardMessageLocation({
      ...messageLocation,
      messageIds: newMessageIds,
    });
  } catch (e) {
    console.error("Failed to update leaderboard message", e);
  }
}
async function renderLeaderboard(client: Client<true>) {
  const leaderboard = (
    await Promise.all(
      Object.entries(await getLeaderboard()).map(async ([discordId, entry]) => {
        const member = await client.guilds.cache
          .get(guildId)
          ?.members.fetch(discordId)
          .catch(async (e: DiscordAPIError) => {
            const reason =
              e.code == 10013
                ? "unknown"
                : e.code == 10007
                ? "left"
                : undefined;
            if (!reason) return undefined; // don't delete if it's any error but unknown user/member
            console.error(
              `Seems like ${
                (
                  await client.users.fetch(discordId).catch((_) => ({
                    displayName: undefined,
                  }))
                ).displayName ?? "a deleted user"
              } left the server, removing from leaderboard (reason: ${reason})`
            );
            await removeLeaderboardEntry(discordId);
            return undefined;
          });
        return {
          displayName: member?.displayName,
          tag: entry.tag,
          region: entry.region,
          rank: await getSoloDuoRank(regionFromStr(entry.region)!, entry.id),
        };
      })
    )
  )
    .filter((entry) => entry.displayName != undefined)
    .sort((a, b) => sortRank(a.rank, b.rank))
    .map((entry, i) => [
      `**[OPGG](https://op.gg/summoners/${entry.region}/${(entry.tag ?? "")
        .replaceAll("#", "-")
        .replaceAll(" ", "%20")})** ${withPlacePrefix(
        i + 1,
        entry.displayName!
      )}`,
      withRankEmoji(entry.rank),
    ]) satisfies [string, string][];

  let messages: (MessageCreateOptions | MessageEditOptions)[] = [];
  for (let i = 0; i < leaderboard.length; i += LIMIT) {
    messages.push({
      embeds: [
        {
          color: Colors.Aqua,
          fields: [
            {
              name: "Players",
              value: Object.values(leaderboard)
                .map((pair) => pair[0])
                .slice(i, i + LIMIT)
                .join("\n"),
              inline: true,
            },
            {
              name: "Rank",
              value: Object.values(leaderboard)
                .map((pair) => pair[1])
                .slice(i, i + LIMIT)
                .join("\n"),
              inline: true,
            },
          ],
        },
      ],
      components: [],
    });
  }

  const firstMessageEmbed = messages[0].embeds![0] as APIEmbed,
    lastMessage = messages[messages.length - 1];
  firstMessageEmbed.title = "SoloQ Leaderboards";
  firstMessageEmbed.description = `Updates <t:${Math.round(
    currentUpdater
      ? currentUpdater.nextUpdate / 1000
      : +new Date() / 1000 + REFRESH_INTERVAL / 1000
  )}:R>`;
  lastMessage.components = [
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      createButton("Your connection", {
        cmd: "leaderboard",
        tag: "config",
      })
    ),
  ];
  (lastMessage.embeds![0] as APIEmbed).timestamp = new Date().toISOString();

  return messages;
}

export default {
  metadata: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Server leaderboards")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      await interaction.reply({
        content: "Sending leaderboard...",
        ephemeral: true,
      });
      const leaderboardMessages = await renderLeaderboard(interaction.client);
      const result = [];
      for (const msg of leaderboardMessages) {
        result.push(
          await interaction.channel!.send(msg as MessageCreateOptions)
        );
      }
      await setLeaderboardMessageLocation({
        channelId: interaction.channelId,
        messageIds: result.map((m) => m.id),
      });
      runLeaderboardUpdater(interaction.client); // (re-)start message updater cycle
      await interaction.deleteReply();
    } catch (e) {
      console.error("Failed to create leaderboard message", e);
    }
  },
  button: async (interaction: ButtonInteraction, _: ButtonMetadata) => {
    try {
      const modal = new ModalBuilder()
        .setCustomId("leaderboard")
        .setTitle("Set up your connection");

      const leaderboardEntry = await getLeaderboardEntry(interaction.user.id);
      const summonerInput = new TextInputBuilder()
        .setCustomId("summonerName")
        .setLabel("Riot ID (empty = remove)")
        .setPlaceholder("AAA#000")
        .setValue(
          leaderboardEntry?.id
            ? leaderboardEntry.tag ??
                (await getSummonerNickname(
                  regionFromStr(leaderboardEntry.region)!,
                  leaderboardEntry.id
                )) ??
                ""
            : ""
        )
        // https://support-leagueoflegends.riotgames.com/hc/en-us/articles/360041788533-Riot-ID-FAQ#:~:text=Game%20Names%20must,OC1%2C%20and%20NA1.
        .setMaxLength(16 + 1 + 5)
        .setRequired(false)
        .setStyle(TextInputStyle.Short);

      const serverInput = new TextInputBuilder()
        .setCustomId("server")
        .setLabel("Server [EUW,EUNE,LAS,NA,OCE,TR,RU,KR]")
        .setPlaceholder("euw")
        .setValue(leaderboardEntry?.region ?? "")
        .setMaxLength(4)
        .setRequired(false)
        .setStyle(TextInputStyle.Short);

      const firstActionRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
          summonerInput
        );
      const secondActionRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
          serverInput
        );

      modal.addComponents(firstActionRow, secondActionRow);
      await interaction.showModal(modal);
    } catch (e) {
      console.error("Failed to create leaderboard modal", e);
    }
  },
  modalSubmit: async (interaction: ModalSubmitInteraction) => {
    await interaction.deferReply({ ephemeral: true });
    try {
      const discordId = interaction.user.id;
      const leaderboardEntry = await getLeaderboardEntry(discordId);
      const summonerName = interaction.fields
          .getTextInputValue("summonerName")
          .trim(),
        server = interaction.fields
          .getTextInputValue("server")
          .trim()
          .toLowerCase();

      if (!summonerName) {
        if (leaderboardEntry) {
          await removeLeaderboardEntry(discordId);
          await updateLeaderboardMessage(interaction.client, "none");
          await interaction.editReply({
            content: "You have been removed from the leaderboards!",
          });
        } else {
          await interaction.editReply({
            content: "No action has been executed.",
          });
        }
        return;
      }

      const region = regionFromStr(server);
      if (!region) {
        await interaction.editReply({ content: "Invalid region input!" });
        return;
      }

      const summonerId = await getSummonerID(region, summonerName);
      if (!summonerId) {
        await interaction.editReply({
          content: `This summoner doesn't exist in region ${server.toUpperCase()}!`,
        });
        return;
      }

      await addLeaderboardEntry(discordId, { region: server, id: summonerId });
      await interaction.editReply({
        content: leaderboardEntry
          ? "Your leaderboard connection has been updated!"
          : "You have been added to the leaderboards!",
      });
      await updateLeaderboardMessage(interaction.client, {
        userId: summonerId,
      });
    } catch (e) {
      console.error("Failed to handle modal submit", e);
      await interaction.editReply({ content: "Failed to handle modal submit" });
    }
  },
};
