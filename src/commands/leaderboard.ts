import {
  ActionRowBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Client,
  Colors,
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
import {
  LolRank,
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
    console.log("Triggering leaderboard update!");
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
    console.log("Failed to update leaderboard message", e);
  }
}
async function renderLeaderboard(client: Client<true>) {
  const leaderboard = (
    (
      await Promise.all(
        Object.entries(await getLeaderboard()).map(
          async ([discordId, entry]) => {
            return [
              (await client.users.fetch(discordId).catch((_) => undefined))
                ?.displayName,
              await getSoloDuoRank(regionFromStr(entry.region)!, entry.id),
            ];
          }
        )
      )
    ).filter(([name, entry]) => name != undefined) as [string, LolRank][]
  )
    .sort((a, b) => sortRank(a[1], b[1]))
    .slice(0, LIMIT)
    .map((pair, i) => [
      withPlacePrefix(i + 1, pair[0]),
      withRankEmoji(pair[1]),
    ]);
  const lines = (v: string[]) => v.reduce((a, b) => `${a}\n${b}`, "").slice(1);
  return {
    embeds: [
      new EmbedBuilder({
        color: Colors.Aqua,
        title: `SoloQ Leaderboards (Top ${LIMIT})`,
        fields: [
          {
            name: "Players",
            value: lines(Object.values(leaderboard).map((pair) => pair[0])),
            inline: true,
          },
          {
            name: "Rank",
            value: lines(Object.values(leaderboard).map((pair) => pair[1])),
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
      console.log("Failed to create leaderboard message", e);
    }
  },
  button: async (interaction: ButtonInteraction, _: ButtonMetadata) => {
    try {
      const modal = new ModalBuilder()
        .setCustomId("leaderboard")
        .setTitle("Set up your connection");

      const leaderboardEntry = await getLeaderboardEntry(interaction.user.id);
      const favoriteColorInput = new TextInputBuilder()
        .setCustomId("summonerName")
        .setLabel("Riot ID (empty = remove) [myname#euw]")
        .setValue(
          leaderboardEntry?.id
            ? (await getSummonerNickname(
                regionFromStr(leaderboardEntry.region)!,
                leaderboardEntry.id
              )) ?? ""
            : ""
        )
        .setRequired(false)
        .setStyle(TextInputStyle.Short);

      const serverInput = new TextInputBuilder()
        .setCustomId("server")
        .setLabel("Server [EUW | EUNE | NA]")
        .setValue(leaderboardEntry?.region ?? "")
        .setStyle(TextInputStyle.Short);

      const firstActionRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
          favoriteColorInput
        );
      const secondActionRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
          serverInput
        );

      modal.addComponents(firstActionRow, secondActionRow);
      await interaction.showModal(modal);
    } catch (e) {
      console.log("Failed to create leaderboard modal", e);
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
      console.log("Failed to handle modal submit", e);
      await interaction.editReply({ content: "Failed to handle modal submit" });
    }
  },
};
