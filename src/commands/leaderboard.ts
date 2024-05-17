import {
  ActionRowBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Client,
  Colors,
  DiscordAPIError,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
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

const LIMIT = 20;
const REFRESH_INTERVAL = timestring("1h", "ms");
let currentUpdater: { timeout: Timer; nextUpdate: number } | undefined =
  undefined;

export async function runLeaderboardUpdater(
  client: Client<true>,
  runImmediately: boolean = false
) {
  if (!(await getLeaderboardMessageLocation())) return; // ignore updater request if no message location exists
  if (currentUpdater) clearInterval(currentUpdater.timeout);
  if (runImmediately) updateLeaderboardMessage(client);
  currentUpdater = {
    timeout: setInterval(function () {
      if (currentUpdater) {
        currentUpdater.nextUpdate = +new Date() + REFRESH_INTERVAL;
      }
      updateLeaderboardMessage(client);
    }, REFRESH_INTERVAL),
    nextUpdate: +new Date() + REFRESH_INTERVAL,
  };
}
async function updateLeaderboardMessage(client: Client<true>) {
  try {
    console.info("Triggering leaderboard update!");
    const messageLocation = await getLeaderboardMessageLocation();
    if (!messageLocation) return;

    const channel = (await client.channels.fetch(
      messageLocation.channelId
    )) as TextChannel | null;
    await channel?.messages.edit(
      messageLocation.messageId,
      await renderLeaderboard(client)
    );
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
    .slice(0, LIMIT)
    .map((entry, i) => [
      `**[OPGG](https://op.gg/summoners/${entry.region}/${(entry.tag ?? "")
        .replaceAll("#", "-")
        .replaceAll(" ", "%20")})** ${withPlacePrefix(
        i + 1,
        entry.displayName!
      )}`,
      withRankEmoji(entry.rank),
    ]);
  return {
    embeds: [
      new EmbedBuilder({
        color: Colors.Aqua,
        title: `SoloQ Leaderboards (Top ${LIMIT})`,
        fields: [
          {
            name: "Players",
            value: Object.values(leaderboard)
              .map((pair) => pair[0])
              .join("\n"),
            inline: true,
          },
          {
            name: "Rank",
            value: Object.values(leaderboard)
              .map((pair) => pair[1])
              .join("\n"),
            inline: true,
          },
        ],
        description: `Updates <t:${Math.round(
          currentUpdater
            ? currentUpdater.nextUpdate / 1000
            : +new Date() / 1000 + REFRESH_INTERVAL / 1000
        )}:R>`,
        timestamp: new Date(),
      }),
    ],
    components: [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        createButton("Your connection", {
          cmd: "leaderboard",
          tag: "config",
        })
      ),
    ],
  };
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
      let res = await interaction.channel!.send(
        await renderLeaderboard(interaction.client)
      );
      await setLeaderboardMessageLocation({
        channelId: interaction.channelId,
        messageId: res.id,
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
            ? (await getSummonerNickname(
                regionFromStr(leaderboardEntry.region)!,
                leaderboardEntry.id
              )) ?? ""
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
        .setMaxLength(4)
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
          await updateLeaderboardMessage(interaction.client);
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
      await updateLeaderboardMessage(interaction.client);
    } catch (e) {
      console.error("Failed to handle modal submit", e);
      await interaction.editReply({ content: "Failed to handle modal submit" });
    }
  },
};
