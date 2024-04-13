import staticPlugin from "@elysiajs/static";
import { Client, Events, GatewayIntentBits } from "discord.js";
import Elysia from "elysia";
import { token } from "../.env.json";
import commands from "./commands";
import { runLeaderboardUpdater } from "./commands/leaderboard";
import auth from "./middleware/auth";
import guide from "./routes/guide";
import riot from "./routes/riot";
import { ButtonMetadata } from "./util/discord";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once(Events.ClientReady, (c) => {
  console.info(`Ready! Logged in as ${c.user.tag}`);
  runLeaderboardUpdater(c, true);
});
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isAutocomplete()) {
    const command = commands[interaction.commandName];
    command && (await command.autocomplete?.(interaction));
    return;
  }
  if (interaction.isButton()) {
    const metadata: ButtonMetadata = JSON.parse(interaction.customId);
    const command = commands[metadata.cmd];
    command && (await command.button?.(interaction, metadata));
    return;
  }
  if (interaction.isModalSubmit()) {
    const command = commands[interaction.customId];
    command && (await command.modalSubmit?.(interaction));
    return;
  }
  if (!interaction.isChatInputCommand()) return;

  const command = commands[interaction.commandName];
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});
client.login(token);

const app = new Elysia()
  .use(staticPlugin({ assets: "./frontend/dist", prefix: "/" }))
  .guard({ beforeHandle: auth }, (app) => app.use(guide).use(riot))
  .listen(4000);

export type Server = typeof app;
